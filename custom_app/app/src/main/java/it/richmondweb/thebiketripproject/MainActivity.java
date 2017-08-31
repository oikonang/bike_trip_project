package it.richmondweb.thebiketripproject;

import android.Manifest;
import android.app.Activity;
import android.app.ProgressDialog;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.SwitchCompat;
import android.util.Log;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

public class MainActivity extends AppCompatActivity {

    private LocationManager locationManager;
    private SettingsManager settingsManager;
    private LocationListener[] locationListeners;
    private String[] locationProviders;
    private boolean hasLocation = false;
    private SwitchCompat weatherSwitch;
    private SwitchCompat autoUploadSwitch;
    private TextView switchText;
    private JobScheduler jobScheduler;
    private EditText weatherLoopTimeSwitch;
    private float weatherLoopTime;
    private static final int WEATHER_JOB_ID = 1;
    private int enqueuedRequestsCount = 0;
    private RequestQueue requestQueue;
    private String SERVER_URL = "http://www.thebiketripproject.com/data/bike_geolocation_data.php";
    private StringBuilder requestsLog = new StringBuilder();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        settingsManager = SettingsManager.getInstance(this);
        weatherSwitch = (SwitchCompat) findViewById(R.id.weatherSwitch);
        autoUploadSwitch = (SwitchCompat) findViewById(R.id.autoUploadSwitch);
        switchText = (TextView) findViewById(R.id.switchText);
        weatherSwitch.setChecked(settingsManager.isWeatherServiceOn());
        autoUploadSwitch.setChecked(settingsManager.isAutoUploadEnabled());
        weatherLoopTimeSwitch = (EditText) findViewById(R.id.weatherLoopTime);

        //Initialize location managers and listeners
        locationManager = (LocationManager)
                getSystemService(Context.LOCATION_SERVICE);
        locationListeners = new LocationListener[]{new GpsLocationListener(this, locationManager),
                new
                        WeatherLocationListener(this, locationManager)};
        locationProviders = new String[]{LocationManager.NETWORK_PROVIDER, LocationManager
                .GPS_PROVIDER};

        //Init RequestQueue for Volley
        requestQueue = Volley.newRequestQueue(this);

        //Request GPS permission at startup
        requestPermissions();

        //Init text intro
        initTextIntro();

        if (settingsManager.isAutoUploadEnabled()) {
            pushGpsLocations();
        }

        //Init listeners for switches
        autoUploadSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean newValue) {
                if (newValue) {
                    if (!settingsManager.isBikeTripStarted()) {
                        Toast.makeText(MainActivity.this, "Bike trip is not started!", Toast
                                .LENGTH_SHORT).show();
                        autoUploadSwitch.setChecked(false);
                        return;
                    }
                }
                settingsManager.updateAutoUpload(newValue);
            }
        });

        weatherSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean newValue) {
                //Start scheduler when is checked
                if (newValue) {
                    String loopTime = weatherLoopTimeSwitch.getText().toString().trim();
                    if (loopTime.equals("")) {
                        Toast.makeText(MainActivity.this, "Insert a valid repeatition time!", Toast.LENGTH_SHORT)
                                .show();
                        weatherSwitch.setChecked(false);
                        return;
                    }
                    weatherLoopTime = Float.parseFloat(loopTime);
                    if (!settingsManager.isBikeTripStarted()) {
                        Toast.makeText(MainActivity.this, "Bike trip is not started!", Toast
                                .LENGTH_SHORT).show();
                        weatherSwitch.setChecked(false);
                        return;
                    }
                    initWeatherJob(weatherLoopTime);
                    switchText.setText("Background Data ON");
                } else {
                    jobScheduler = (JobScheduler) MainActivity.this.getSystemService(Context
                            .JOB_SCHEDULER_SERVICE);
                    jobScheduler.cancel(WEATHER_JOB_ID);
                    switchText.setText("Background Data OFF");
                }
                settingsManager.updateWeatherService(newValue);
            }
        });
    }

    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.main_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();
        switch (id) {
            case R.id.pushGpsLocations:
                pushGpsLocations();
                break;
            default:
                break;
        }
        return false;
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private void initWeatherJob(float loopTimeMin) {
        ComponentName componentName = new ComponentName(this, WeatherService.class);
        JobInfo jobInfo = new JobInfo.Builder(WEATHER_JOB_ID, componentName)
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setRequiresDeviceIdle(false)
                .setPeriodic((int) (loopTimeMin * 60000))
                .build();
        jobScheduler = (JobScheduler) MainActivity.this.getSystemService(Context
                .JOB_SCHEDULER_SERVICE);
        int result = jobScheduler.schedule(jobInfo);
        if (result == JobScheduler.RESULT_SUCCESS)
            Log.d("JOB SCHEDULER", "Job scheduled successfully!");
        else
            Log.e("JOB SCHEDULER", "Error in scheduling job!");
    }

    private void initTextIntro() {
        TextView textIntro = (TextView) findViewById(R.id.textIntro);
        Button startStopButton = (Button) findViewById(R.id.startStopButton);
        if (settingsManager.isBikeTripStarted()) {
            startStopButton.setText("Stop Bike Trip");
            startStopButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    stopBikeTrip();
                }
            });
            textIntro.setText("Bike trip has started on: " + settingsManager.getStartDate()
                    + "\nDay Number " + (settingsManager.getElapsedDays() + 1));
        } else {
            startStopButton.setText("Start Bike Trip");
            startStopButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    startBikeTrip();
                    initTextIntro();
                }
            });
            textIntro.setText("Bike Trip has not started yet.");
        }
    }

    public void startBikeTrip() {
        settingsManager.startBikeTrip();
        Toast.makeText(this, "Bike Trip has now started!", Toast.LENGTH_SHORT).show();
        getCoordinates(null);
    }

    public void stopBikeTrip() {
        AlertDialog.Builder dialog = new AlertDialog.Builder(MainActivity.this);
        dialog.setMessage("Please confirm if you really want to stop the bike trip. The day count" +
                " will stop and you won't be able to recover the day count.");
        dialog.setTitle("Are you sure?");
        dialog.setCancelable(false);
        dialog.setPositiveButton(android.R.string.yes,
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface paramDialogInterface, int paramInt) {
                        settingsManager.updateState(2);
                        Toast.makeText(MainActivity.this, "Bike Trip has now stopped!", Toast
                                .LENGTH_LONG)
                                .show();
                        getCoordinates(null);
                        settingsManager.stopBikeTrip();
                        initTextIntro();
                    }
                });
        dialog.setNegativeButton(android.R.string.cancel, new DialogInterface
                .OnClickListener() {
            @Override
            public void onClick(DialogInterface paramDialogInterface, int paramInt) {
            }
        });
        dialog.show();
    }

    private String getBestLocationProvider() throws Exception {
        boolean networkProviderEnabled = locationManager.isProviderEnabled(locationProviders[0]);
        boolean gpsProviderEnabled = locationManager.isProviderEnabled(locationProviders[1]);

        if (!networkProviderEnabled && !gpsProviderEnabled)
            throw new Exception("No available location providers enabled! Turn on either network " +
                    "or GPS.");
        if (networkProviderEnabled)
            return locationProviders[0];
        else
            return locationProviders[1];
    }

    private void requestPermissions() {
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission
                .ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(this, Manifest.permission
                .WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission
                    .ACCESS_COARSE_LOCATION,
                    Manifest.permission
                            .ACCESS_FINE_LOCATION, Manifest.permission.WRITE_EXTERNAL_STORAGE}, 0);
        }
    }

    public void getCoordinates(View view) {
        if (!settingsManager.isBikeTripStarted()) {
            Toast.makeText(this, "Bike trip is not started!", Toast.LENGTH_SHORT).show();
            return;
        }
        String provider;
        try {
            provider = getBestLocationProvider();
        } catch (Exception e) {
            showAlertMessageNoGps(e.getMessage());
            return;
        }

        //Check for permission (always)
        if (Build.VERSION.SDK_INT >= 23 &&
                ContextCompat.checkSelfPermission(this, android.Manifest.permission
                        .ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, android.Manifest.permission
                        .ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "GPS Permissions not granted!", Toast.LENGTH_LONG).show();
            requestPermissions();
            return;
        }
        locationManager.requestLocationUpdates(provider, 0, 0,
                locationListeners[0]);
        new WaitForLocationTask().execute(this);
    }

    private void showAlertMessageNoGps(String message) {
        // notify user
        final AlertDialog.Builder dialog = new AlertDialog.Builder(MainActivity.this);
        dialog.setMessage(message);
        dialog.setTitle("Error");
        dialog.setPositiveButton("Open GPS Settings",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface paramDialogInterface, int paramInt) {
                        startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
                    }
                });
        dialog.setNegativeButton("Cancel", new DialogInterface
                .OnClickListener() {
            @Override
            public void onClick(DialogInterface paramDialogInterface, int paramInt) {
            }
        });
        dialog.show();
    }

    private boolean isConnected() {
        ConnectivityManager connMgr = (ConnectivityManager) getSystemService(Activity.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        return networkInfo != null && networkInfo.isConnected();
    }

    public void getWeather(View view) {
        if (isConnected())
            getWeatherByCoordinates();
        else
            Toast.makeText(this, "You don't have an active connection now! Cannot get weather " +
                    "data.", Toast.LENGTH_LONG).show();
    }

    public void getWeatherByCoordinates() {
        if (!settingsManager.isBikeTripStarted()) {
            Toast.makeText(this, "Bike trip is not started!", Toast.LENGTH_SHORT).show();
            return;
        }
        String provider;
        try {
            provider = getBestLocationProvider();
        } catch (Exception e) {
            showAlertMessageNoGps(e.getMessage());
            return;
        }

        //Check for permission (always)
        if (Build.VERSION.SDK_INT >= 23 &&
                ContextCompat.checkSelfPermission(this, android.Manifest.permission
                        .ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, android.Manifest.permission
                        .ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "GPS Permissions not granted!", Toast.LENGTH_LONG).show();
            requestPermissions();
            return;
        }
        locationManager.requestLocationUpdates(provider, 0, 0,
                locationListeners[1]);
        new WaitForLocationTask().execute(this);
    }

    public void locationFound() {
        this.hasLocation = true;
    }

    private void pushGpsLocations() {
        if (!isConnected()) {
            Toast.makeText(this, "Cannot upload pending locations: no active connection " +
                    "available! Please retry when you " +
                    "have access to internet.", Toast.LENGTH_LONG).show();
            return;
        }
        CSVUtils csvUtils = CSVUtils.getInstance(this);
        try {
            List<String[]> locationsData = csvUtils.readCSV();
            int count = 0;
            for (String[] data : locationsData) {
                String lat = data[0];
                String lon = data[1];
                String date = data[2];
                String day = data[3];
                String state = data[4];
                enqueueUploadRequest(lat, lon, date, day, state, count);
            }
            new RequestsUploadTask().execute(this);
        } catch (IOException e) {
            Toast.makeText(this, "There's no data to upload!", Toast.LENGTH_SHORT).show();
        }
    }

    private void enqueueUploadRequest(final String lat, final String lon, final String date,
                                      final String day, final String state, final
                                      int count) {
        Request request = new StringRequest(Request.Method.POST, SERVER_URL, new Response.Listener<String>() {
            @Override
            public void onResponse(String response) {
                Log.d("Request Response", response);
                String log = "Request #" + count + ": Success\n";
                requestsLog.append(log);
                enqueuedRequestsCount--;
            }
        }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.d("ERROR RESPONSE", error.toString());
                String log = "Request #" + count + ": Error\n";
                requestsLog.append(log);
                enqueuedRequestsCount--;
            }
        }) {
            @Override
            public Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                params.put("lat", lat);
                params.put("lon", lon);
                params.put("date", date);
                params.put("day", day);
                params.put("state", state);
                return params;
            }
        };
        // Adding request to request queue
        requestQueue.add(request);
        enqueuedRequestsCount++;
    }

    private class WaitForLocationTask extends AsyncTask<Context, Void, Void> {

        private ProgressDialog progressDialog = new ProgressDialog(MainActivity.this);
        private static final int MAX_TIME = 120000;

        @Override
        protected void onPreExecute() {
            progressDialog.setCancelable(false);
            this.progressDialog.setMessage("Determining your location, please wait...");
            this.progressDialog.show();
        }

        @Override
        protected Void doInBackground(Context... contexts) {
            Long t = Calendar.getInstance().getTimeInMillis();
            while (!hasLocation && Calendar.getInstance().getTimeInMillis() - t < MAX_TIME) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            return null;
        }

        @Override
        protected void onPostExecute(final Void unused) {
            if (this.progressDialog.isShowing()) {
                this.progressDialog.dismiss();
            }
            hasLocation = false;
        }
    }

    private class RequestsUploadTask extends AsyncTask<Context, Void, Void> {

        private ProgressDialog progressDialog = new ProgressDialog(MainActivity.this);
        private static final int MAX_TIME = 120000;

        @Override
        protected void onPreExecute() {
            progressDialog.setCancelable(false);
            this.progressDialog.setMessage("Uploading all pending locations to server, please " +
                    "wait...");
            this.progressDialog.show();
        }

        @Override
        protected Void doInBackground(Context... contexts) {
            Long t = Calendar.getInstance().getTimeInMillis();
            while (enqueuedRequestsCount > 0 && Calendar.getInstance().getTimeInMillis() - t <
                    MAX_TIME) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            return null;
        }

        @Override
        protected void onPostExecute(final Void unused) {
            if (this.progressDialog.isShowing()) {
                this.progressDialog.dismiss();
            }
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("Upload Log")
                    .setMessage(requestsLog.toString())
                    .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialogInterface, int i) {
                        }
                    })
                    .show();
            if (!requestsLog.toString().contains("Error")) {
                CSVUtils csvUtils = CSVUtils.getInstance(MainActivity.this);
                boolean result = csvUtils.deleteLocationsFile();
                Log.d("LOCATION FILE DELETED", String.valueOf(result));
            }
            requestsLog = new StringBuilder();
        }
    }
}
