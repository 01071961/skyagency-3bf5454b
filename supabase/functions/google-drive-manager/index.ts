import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, user_id } = body;

    console.log(`[google-drive-manager] Action: ${action}, User: ${user_id}`);

    // Action: Get OAuth URL for Google Drive
    if (action === "get-auth-url") {
      const { origin } = body;

      if (!origin) {
        return new Response(JSON.stringify({ error: "Origin ausente" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const normalizedOrigin = String(origin).replace(/\/+$/, '');
      const redirectUri = `${normalizedOrigin}/drive-callback`;
      const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
      const state = encodeURIComponent(JSON.stringify({ user_id, action: "callback" }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&include_granted_scopes=true` +
        `&state=${state}`;

      console.log("[google-drive-manager] Generated auth URL with redirect:", redirectUri);
      return new Response(JSON.stringify({ authUrl, redirectUri }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Exchange code for tokens (callback from OAuth)
    if (action === "exchange-code") {
      const { code, redirect_uri } = body;
      
      console.log("[google-drive-manager] Exchanging code for tokens");
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error("[google-drive-manager] Token exchange error:", tokens);
        return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save tokens to database
      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      
      const { error: upsertError } = await supabase
        .from("user_drive_tokens")
        .upsert({
          user_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: expiryDate,
          scope: tokens.scope,
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error("[google-drive-manager] Error saving tokens:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to save tokens" }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update profile to mark drive as connected
      await supabase
        .from("profiles")
        .update({ drive_connected: true })
        .eq("user_id", user_id);

      console.log("[google-drive-manager] Tokens saved successfully");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user tokens and refresh if needed
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_drive_tokens")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (tokenError || !tokenData) {
      console.log("[google-drive-manager] No tokens found for user");
      return new Response(JSON.stringify({ error: "Drive não conectado" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenData.access_token;

    // Check if token needs refresh
    if (new Date(tokenData.expiry_date) <= new Date()) {
      console.log("[google-drive-manager] Token expired, refreshing...");
      
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const newTokens = await refreshResponse.json();

      if (newTokens.error) {
        console.error("[google-drive-manager] Token refresh error:", newTokens);
        // Mark drive as disconnected
        await supabase
          .from("profiles")
          .update({ drive_connected: false })
          .eq("user_id", user_id);
        
        return new Response(JSON.stringify({ error: "Token expired, please reconnect" }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accessToken = newTokens.access_token;
      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      await supabase
        .from("user_drive_tokens")
        .update({
          access_token: newTokens.access_token,
          expiry_date: newExpiry,
        })
        .eq("user_id", user_id);

      console.log("[google-drive-manager] Token refreshed successfully");
    }

    // Action: Create root folder
    if (action === "create-root-folder") {
      const folderName = "SkyInvestimentos - Meus Arquivos";

      // Check if folder already exists
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
        )}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const searchData = await searchResponse.json();
      let folderId = searchData.files?.[0]?.id;

      if (!folderId) {
        // Create folder
        const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        });

        const createData = await createResponse.json();
        folderId = createData.id;
        console.log("[google-drive-manager] Created root folder:", folderId);
      }

      return new Response(JSON.stringify({ folderId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: List files in folder
    if (action === "list-files") {
      const { folderId } = body;

      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `'${folderId}' in parents and trashed=false`
        )}&fields=files(id,name,size,modifiedTime,webViewLink,mimeType)&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const listData = await listResponse.json();

      return new Response(JSON.stringify({ files: listData.files || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Upload file
    if (action === "upload") {
      const { folderId, file_name, file_data, file_mime } = body;

      // Decode base64
      const base64Content = file_data.split(",")[1] || file_data;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create file metadata
      const metadata = {
        name: file_name,
        parents: [folderId],
      };

      // Multipart upload
      const boundary = "-------" + Date.now().toString(16);
      const delimiter = "\r\n--" + boundary + "\r\n";
      const closeDelimiter = "\r\n--" + boundary + "--";

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${file_mime}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Content +
        closeDelimiter;

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      const uploadData = await uploadResponse.json();

      if (uploadData.error) {
        console.error("[google-drive-manager] Upload error:", uploadData.error);
        return new Response(JSON.stringify({ error: uploadData.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log("[google-drive-manager] File uploaded:", uploadData.name);
      return new Response(JSON.stringify({ file: uploadData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Delete file
    if (action === "delete") {
      const { fileId } = body;

      const deleteResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        console.error("[google-drive-manager] Delete error:", errorData);
        return new Response(JSON.stringify({ error: errorData.error?.message || "Delete failed" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log("[google-drive-manager] File deleted:", fileId);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[google-drive-manager] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
