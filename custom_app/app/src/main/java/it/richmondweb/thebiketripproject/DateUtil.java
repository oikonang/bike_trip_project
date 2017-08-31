package it.richmondweb.thebiketripproject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by ricky on 21/03/2017.
 */

public abstract class DateUtil {

    private static final String DATETIME_FORMAT = "y-MM-dd HH:mm:ss";

    public static String getCurrentTimestamp() {
        return new SimpleDateFormat(DATETIME_FORMAT).format(new Date());
    }

    //1 minute = 60 seconds
    //1 hour = 60 x 60 = 3600
    //1 day = 3600 x 24 = 86400
    public static int daysBetweenDates(String startDateString, String endDateString) throws
            ParseException {
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(DATETIME_FORMAT);
        Date startDate = simpleDateFormat.parse(startDateString);
        Date endDate = simpleDateFormat.parse(endDateString);

        //milliseconds
        long different = endDate.getTime() - startDate.getTime();
        long secondsInMilli = 1000;
        long minutesInMilli = secondsInMilli * 60;
        long hoursInMilli = minutesInMilli * 60;
        long daysInMilli = hoursInMilli * 24;
        return (int) (different / daysInMilli);
    }
}
