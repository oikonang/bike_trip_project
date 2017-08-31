package it.richmondweb.thebiketripproject;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
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

class WeatherLocationListener implements LocationListener {

    private Context context;
    private LocationManager locationManager;
    private static final String OPENWEATHER_API_KEY = "b1e68364135aab4e5c38e9675d5bbd61";
    private static final String OPENWEATHER_API_BASE_URL = "http://api.openweathermap" +
            ".org/data/2.5/weather?";
    private String SERVER_URL = "http://www.thebiketripproject.com/data/weather_data.php";
    private RequestQueue requestQueue;

    public WeatherLocationListener(Context context, LocationManager locationManager) {
        this.context = context;
        this.locationManager = locationManager;

        //Init RequestQueue for Volley
        requestQueue = Volley.newRequestQueue(context);
    }

    @Override
    public void onLocationChanged(Location location) {
        double lat = location.getLatitude();
        double lon = location.getLongitude();
        String url = OPENWEATHER_API_BASE_URL + "lat=" + lat + "&lon=" + lon + "&APPID=" + OPENWEATHER_API_KEY;
        Request request = new StringRequest(Request.Method.GET, url, new Response
                .Listener<String>() {
            @Override
            public void onResponse(String response) {
                Log.d("Weather Response", "Received data...");
                uploadWeatherDataToServer(response);
                if (context instanceof MainActivity) {
                    ((MainActivity) context).locationFound();
                }
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.d("Weather ERROR RESPONSE", error.toString());
                if (context instanceof MainActivity) {
                    Toast.makeText(context, "An error occurred! Please try again...", Toast
                            .LENGTH_SHORT)
                            .show();
                    ((MainActivity) context).locationFound();
                }
            }
        });

        // Adding request to request queue
        requestQueue.add(request);

        locationManager.removeUpdates(this);
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

    private void uploadWeatherDataToServer(final String data) {
        Request request = new StringRequest(Request.Method.POST, SERVER_URL, new Response.Listener<String>() {
            @Override
            public void onResponse(String response) {
                Log.d("Weather Data Upload", response);
                if (context instanceof MainActivity)
                    Toast.makeText(context, "Weather data successfully uploaded to server!", Toast
                            .LENGTH_SHORT)
                            .show();
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.d("ERROR WEATHER DATA", error.toString());
                if (context instanceof MainActivity)
                    Toast.makeText(context, "An error occurred! Please try again...", Toast
                            .LENGTH_SHORT)
                            .show();
            }
        }) {
            @Override
            public Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                params.put("data", data);
                return params;
            }
        };
        // Adding request to request queue
        requestQueue.add(request);
    }
}
