package com.dnch.truckloader;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
@CapacitorPlugin(name="TruckNative")
public class TruckNativePlugin extends Plugin {
  @PluginMethod public void printPlan(PluginCall call) {
    getActivity().runOnUiThread(()->{
      try{
        PrintManager mgr=(PrintManager)getActivity().getSystemService(Context.PRINT_SERVICE);
        if(mgr==null){call.reject("Няма Android услуга за печат.");return;}
        PrintDocumentAdapter adapter=getBridge().getWebView().createPrintDocumentAdapter("Товарене на ремарке");
        mgr.print("Товарене на ремарке",adapter,new PrintAttributes.Builder().build());
        call.resolve();
      }catch(Exception e){call.reject("Грешка при печат",e);}
    });
  }
  @PluginMethod public void savePlan(PluginCall call) {
    String data=call.getString("data"),filename=call.getString("filename");
    if(data==null||filename==null){call.reject("Липсват JSON данни.");return;}
    Intent pick=new Intent(Intent.ACTION_CREATE_DOCUMENT);
    pick.addCategory(Intent.CATEGORY_OPENABLE);
    pick.setType("application/json");
    pick.putExtra(Intent.EXTRA_TITLE,filename);
    startActivityForResult(call,pick,"onSaved");
  }
  @ActivityCallback private void onSaved(PluginCall call,ActivityResult result) {
    if(call==null)return;
    if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){
      call.reject("cancel");return;
    }
    try(OutputStream out=getActivity().getContentResolver().openOutputStream(result.getData().getData())){
      if(out==null)throw new java.io.IOException("No output stream");
      out.write(call.getString("data","").getBytes(StandardCharsets.UTF_8));
      out.flush();
      JSObject response=new JSObject();response.put("saved",true);call.resolve(response);
    }catch(Exception e){call.reject("Не може да се запише JSON.",e);}
  }
}