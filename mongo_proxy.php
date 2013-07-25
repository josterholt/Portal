<?php
$domain = 'api.mongolab.com';
list($url, $querystring) = explode("?", $_SERVER['SCRIPT_NAME'], 2);
$pieces = explode("/", $url);
array_pop($pieces);
$ext = implode("/", $pieces);

$api_url = substr($_SERVER['REQUEST_URI'], (strpos($_SERVER['REQUEST_URI'], $ext) + strlen($ext)), strlen($_SERVER['REQUEST_URI']));
//$api_url = str_replace($ext, "", $_SERVER['REQUEST_URI']);

$url = 'https://'.$domain.$api_url .'?apiKey=507873c4e4b0e9396b4a4865&'.$querystring;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
//curl_setopt($ch, CURLOPT_HEADER, FALSE);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$result = curl_exec($ch);

$error = curl_error($ch);
if(!empty($error))
{
	print_r($error);
	echo "\n";
}

curl_close($ch);
print_r($result);

//https://ostwebdev.com/mongo_proxy.php?url=api.mongolab.com/api/1/databases/dollmaker/collections/items?apiKey=507873c4e4b0e9396b4a4865