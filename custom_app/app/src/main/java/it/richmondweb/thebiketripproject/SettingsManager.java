package it.richmondweb.thebiketripproject;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.ParseException;

/**
 * Created by ricky on 25/05/2017.
 */

public class SettingsManager {
    private static final String PREF_NAME = "MyPref";
    private static SettingsManager instance;
    private SharedPreferences preferences;
    private SharedPreferences.Editor editor;
    private Context context;
    private static final String KEY_START_DATE = "startDate";
    private static final String KEY_STOP_DATE = "stopDate";
    private static final String KEY_WEATHER_SERVICE_ON = "weatherServiceOn";
    private static final String KEY_AUTO_UPLOAD = "autoUpload";
    private static final String KEY_STATE = "state";

    private SettingsManager(Context context) {
        this.context = context;
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        editor = preferences.edit();
        editor.apply();
        instance = this;
    }

    public static SettingsManager getInstance(Context context) {
        if (instance == null)
            return new SettingsManager(context);
        return instance;
    }

    public void startBikeTrip() {
        String today = DateUtil.getCurrentTimestamp();
        editor.putString(KEY_START_DATE, today);
        editor.putString(KEY_STOP_DATE, "");
        editor.putBoolean(KEY_WEATHER_SERVICE_ON, false);
        editor.putBoolean(KEY_AUTO_UPLOAD, false);
        editor.putInt(KEY_STATE, 0);
        editor.commit();
    }

    public int getState() {
        return preferences.getInt(KEY_STATE, 0);
    }

    public boolean isBikeTripStarted() {
        return !preferences.getString(KEY_START_DATE, "").equals("") && preferences.getString
                (KEY_STOP_DATE, "").equals("");
    }

    public void updateState(int value) {
        editor.putInt(KEY_STATE, value);
        editor.commit();
    }

    public int getElapsedDays() {
        try {
            return DateUtil.daysBetweenDates(preferences.getString(KEY_START_DATE, ""), DateUtil
                    .getCurrentTimestamp());
        } catch (ParseException e) {
            return -1;
        }
    }

    public String getStartDate() {
        return preferences.getString(KEY_START_DATE, "");
    }

    public boolean isWeatherServiceOn() {
        return preferences.getBoolean(KEY_WEATHER_SERVICE_ON, false);
    }

    public boolean isAutoUploadEnabled() {
        return preferences.getBoolean(KEY_AUTO_UPLOAD, false);
    }

    public void updateAutoUpload(boolean value) {
        editor.putBoolean(KEY_AUTO_UPLOAD, value);
        editor.commit();
    }

    public void stopBikeTrip() {
        String today = DateUtil.getCurrentTimestamp();
        editor.putString(KEY_STOP_DATE, today);
        editor.commit();
    }

    public void updateWeatherService(boolean value) {
        editor.putBoolean(KEY_WEATHER_SERVICE_ON, value);
        editor.commit();
    }
}
