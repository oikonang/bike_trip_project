package it.richmondweb.thebiketripproject;

import android.app.Activity;
import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by ricky on 27/05/2017.
 */

public class GpsLocationListener implements LocationListener {

    private final LocationManager locationManager;
    private Context context;
    private String SERVER_URL = "http://www.thebiketripproject.com/data/bike_geolocation_data.php";
    private RequestQueue requestQueue;

    public GpsLocationListener(Context context, LocationManager locationManager) {
        this.context = context;
        this.locationManager = locationManager;

        //Init RequestQueue for Volley
        requestQueue = Volley.newRequestQueue(context);
    }

    @Override
    public void onLocationChanged(Location location) {
        double latitude = location.getLatitude();
        double longitude = location.getLongitude();
        locationManager.removeUpdates(this);
        ((MainActivity) context).locationFound();
        String message;
        if (isConnected()) {
            pushLocationToServer(latitude, longitude);
        } else {
            saveLocationToFile(String.valueOf(latitude), String.valueOf(longitude));
            message = "Impossible to connect to server. Location enqueued in temp file, push " +
                    "manually when you have an active connection.";
            Toast.makeText(context, message, Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onStatusChanged(String s, int i, Bundle bundle) {
    }

    @Override
    public void onProviderEnabled(String s) {
    }

    @Override
    public void onProviderDisabled(String s) {
    }

    private void saveLocationToFile(String lat, String lon) {
        CSVUtils csvUtils = CSVUtils.getInstance(context);
        csvUtils.addLine(lat, lon);
    }

    private void pushLocationToServer(final double lat, final double lon) {
        SettingsManager settingsManager = SettingsManager.getInstance(context);
        final String currentTimeString = DateUtil.getCurrentTimestamp();
        final String currentDayNumber = String.valueOf(settingsManager.getElapsedDays
                () + 1);
        final String currentState = String.valueOf(settingsManager.getState());
        if (settingsManager.getState() == 0)
            settingsManager.updateState(settingsManager.getState() + 1);
        Request request = new StringRequest(Request.Method.POST, SERVER_URL, new Response.Listener<String>() {
            @Override
            public void onResponse(String response) {
                Log.d("Request Response", response);
                Toast.makeText(context, "Location successfully uploaded to server!", Toast
                        .LENGTH_SHORT)
                        .show();
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.d("ERROR RESPONSE", error.toString());
                Toast.makeText(context, "An error occurred! Please try again...", Toast
                        .LENGTH_SHORT)
                        .show();
            }
        }) {
            @Override
            public Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                params.put("lat", String.valueOf(lat));
                params.put("lon", String.valueOf(lon));
                params.put("date", currentTimeString);
                params.put("day", currentDayNumber);
                params.put("state", currentState);
                return params;
            }
        };
        // Adding request to request queue
        requestQueue.add(request);
    }

    private boolean isConnected() {
        ConnectivityManager connMgr = (ConnectivityManager) context.getSystemService(Activity
                .CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        return networkInfo != null && networkInfo.isConnected();
    }
}
