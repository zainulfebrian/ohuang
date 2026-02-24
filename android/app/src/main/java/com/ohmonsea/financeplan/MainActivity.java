package com.ohmonsea.financeplan;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDownloadPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
