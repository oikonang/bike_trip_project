<?php

$json = json_decode($_POST["data"],true);
$date = date("Y_m_d_H_i_s");
$filename = "Weather_Data_".$date.".json";

//Save JSON to file (in same folder of the PHP file)
$file_handle = fopen($filename, 'w');
fwrite($file_handle, $_POST["data"]);
fclose($file_handle);

$response = "Successfully saved file ".$filename;
echo $response;

?>