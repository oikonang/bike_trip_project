package it.richmondweb.thebiketripproject;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Looper;
import android.support.annotation.RequiresApi;
import android.support.v4.content.ContextCompat;
import android.util.Log;

@RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
public class WeatherService extends JobService {

    private LocationManager locationManager;
    private String[] locationProviders;


    @Override
    public boolean onStartJob(JobParameters jobParameters) {
        new GetWeatherTask().execute(jobParameters);
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters jobParameters) {
        Log.d("JOB FINISHED", "Job finished");
        return true; //should always reschedule
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

    private class GetWeatherTask extends AsyncTask<JobParameters, Void, JobParameters[]> {

        @Override
        protected JobParameters[] doInBackground(JobParameters... params) {
            locationManager = (LocationManager)
                    getSystemService(Context.LOCATION_SERVICE);
            LocationListener locationListener = new WeatherLocationListener(WeatherService.this, locationManager);
            locationProviders = new String[]{LocationManager.NETWORK_PROVIDER, LocationManager
                    .GPS_PROVIDER};
            //Try to get provider, if none is available finish task
            String provider;
            try {
                provider = getBestLocationProvider();
            } catch (Exception e) {
                Log.d("WEATHER ERROR", e.getMessage());
                return params;
            }
            //Check for permission (always), if not granted finish task
            if (Build.VERSION.SDK_INT >= 23 &&
                    ContextCompat.checkSelfPermission(WeatherService.this, android.Manifest.permission
                            .ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(WeatherService.this, android.Manifest.permission
                            .ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                return params;
            }
            locationManager.requestLocationUpdates(provider, 0, 0,
                    locationListener, Looper.getMainLooper());
            return params;
        }

        @Override
        protected void onPostExecute(JobParameters[] params) {
            for (JobParameters param : params)
                jobFinished(param, true);
        }
    }
}
