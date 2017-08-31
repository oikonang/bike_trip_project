package it.richmondweb.thebiketripproject;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import org.apache.commons.lang3.StringUtils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Created by ricky on 04/04/2017.
 */

public class CSVUtils {

    private Context context;
    private static CSVUtils instance;
    private static final String LOCATIONS_FILENAME = "locations_to_push.csv";

    private CSVUtils(Context context) {
        this.context = context;
    }

    public static CSVUtils getInstance(Context context) {
        if (instance == null)
            instance = new CSVUtils(context);
        return instance;
    }

    public List<String[]> readCSV() throws FileNotFoundException {
        File filePath = new File(Environment.getExternalStoragePublicDirectory(Environment
                .DIRECTORY_DOWNLOADS), "TheBikeTripProject");
        File file = new File(filePath, LOCATIONS_FILENAME);
        List<String[]> locationsData = new ArrayList<>();
        FileInputStream inputStream = new FileInputStream(file);
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String csvLine;
        try {
            while ((csvLine = reader.readLine()) != null && !csvLine.equals("")) {
                String[] rowData = csvLine.split(",");
                String lat = rowData[0];
                String lon = rowData[1];
                String date = rowData[2];
                String day = rowData[3];
                String state = rowData[4];
                locationsData.add(new String[]{lat, lon, date, day, state});
            }
        } catch (IOException e) {
            Log.e("CSV Reader", "IOException:", e);
        } finally {
            try {
                reader.close();
            } catch (IOException e) {
                Log.e("CSV Reader", "IOException:", e);
            }
        }
        return locationsData;
    }

    public void addLine(String lat, String lon) {
        SettingsManager settingsManager = SettingsManager.getInstance(context);
        String currentTimeString = DateUtil.getCurrentTimestamp();
        String currentDayNum = String.valueOf(settingsManager.getElapsedDays
                () + 1);
        String currentState = String.valueOf(settingsManager.getState());
        if (settingsManager.getState() == 0)
            settingsManager.updateState(settingsManager.getState() + 1);
        String content = StringUtils.join(new String[]{lat, lon, currentTimeString,
                currentDayNum, currentState}, ',');
        File savePath = new File(Environment.getExternalStoragePublicDirectory(Environment
                .DIRECTORY_DOWNLOADS), "TheBikeTripProject");

        if (!savePath.exists()) {
            if (!savePath.mkdirs()) {
                Log.d("EXPORT ERROR", "Could not create directory!");
            }
        }
        Log.d("SAVING", savePath.getAbsolutePath() + "/" + LOCATIONS_FILENAME);
        File file = new File(savePath, LOCATIONS_FILENAME);
        try {
            FileOutputStream out = new FileOutputStream(file, true);
            out.write((content + "\n").getBytes());
            out.flush();
            out.close();
            Log.i("EXPORT", "File saved/updated!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean deleteLocationsFile() {
        File savePath = new File(Environment.getExternalStoragePublicDirectory(Environment
                .DIRECTORY_DOWNLOADS), "TheBikeTripProject");
        File file = new File(savePath, LOCATIONS_FILENAME);
        return file.delete();
    }
}
