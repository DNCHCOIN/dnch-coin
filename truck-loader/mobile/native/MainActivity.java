package com.dnch.truckloader;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(TruckNativePlugin.class);
    super.onCreate(savedInstanceState);
  }
}