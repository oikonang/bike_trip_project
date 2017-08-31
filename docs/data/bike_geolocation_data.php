<?php

$lat = $_POST["lat"];
$lon = $_POST["lon"];
$date = $_POST["date"];
$day = $_POST["day"];
$state = $_POST["state"];

$filename = "geolocations.csv";
$data = array($day,$date,$lat,$lon,$state);
$data_string = implode(",", $data); //Create CSV line
file_put_contents($filename, $data_string."\r\n", FILE_APPEND);

$response = "Successfully saved location to file ".$filename;
echo $response;

?>