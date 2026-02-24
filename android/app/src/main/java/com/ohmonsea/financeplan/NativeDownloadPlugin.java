package com.ohmonsea.financeplan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import android.Manifest;

import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(
    name = "NativeDownload",
    permissions = {
        @Permission(
            alias = "storage",
            strings = {
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        )
    }
)
public class NativeDownloadPlugin extends Plugin {

    private static final String CHANNEL_ID = "download_channel";

    @PluginMethod
    public void download(PluginCall call) {
        String filename = call.getString("filename");
        String base64Data = call.getString("base64Data");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (filename == null || base64Data == null) {
            call.reject("Must provide filename and base64Data");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                if (getPermissionState("storage") != com.getcapacitor.PermissionState.GRANTED) {
                    requestPermissionForAlias("storage", call, "storagePermsCallback");
                    return; // Wait for permission callback
                }
            }
            performDownload(call, filename, base64Data, mimeType);
        } catch (Exception e) {
            Log.e("NativeDownloadPlugin", "Error initiated", e);
            call.reject("Failed to initiate: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void storagePermsCallback(PluginCall call) {
        if (getPermissionState("storage") == com.getcapacitor.PermissionState.GRANTED) {
            String filename = call.getString("filename");
            String base64Data = call.getString("base64Data");
            String mimeType = call.getString("mimeType", "application/octet-stream");
            performDownload(call, filename, base64Data, mimeType);
        } else {
            call.reject("Storage permission is required to save files on older Android devices.");
        }
    }

    private void performDownload(PluginCall call, String filename, String base64Data, String mimeType) {
        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            Uri fileUri;
            File legacyFile = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                fileUri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                
                if (fileUri != null) {
                    try (java.io.OutputStream os = getContext().getContentResolver().openOutputStream(fileUri)) {
                        if (os != null) {
                            os.write(bytes);
                        }
                    }
                } else {
                    throw new Exception("Failed to create MediaStore entry");
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }

                legacyFile = new File(downloadsDir, filename);
                FileOutputStream fos = new FileOutputStream(legacyFile);
                fos.write(bytes);
                fos.close();
                
                fileUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", legacyFile);
            }

            try {
                showNotification(filename, fileUri, mimeType);
            } catch (Exception notificationError) {
                Log.e("NativeDownloadPlugin", "Failed to show notification. File was saved successfully.", notificationError);
            }

            JSObject ret = new JSObject();
            ret.put("path", fileUri.toString());
            call.resolve(ret);

        } catch (Exception e) {
            Log.e("NativeDownloadPlugin", "Error saving file", e);
            call.reject("Failed to save file: " + e.getMessage());
        }
    }

    private void showNotification(String filename, Uri fileUri, String mimeType) {
        Context context = getContext();
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Downloads",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        
        intent.setDataAndType(fileUri, mimeType);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(filename)
                .setContentText("Download Selesai. Ketuk untuk membuka.")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }
}
