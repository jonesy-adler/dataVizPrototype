<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Accept, Content-Type");

$servername = "localhost";
$username = "phpmyadmin";
$password = "OqTAuGphXKPB";
$database = "usageTracking";

$paramters = $_GET;
if (!array_key_exists, 'table'){
    exit("No table parameter found");
}


try {
    $pdo = new PDO("mysql:host=$servername;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "INSERT INTO `$table` (id) VALUES (NULL)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $json = json_encode($data, JSON_PRETTY_PRINT);
    echo $json;

} catch(PDOException $e){
    $error = ["error" => "Database error: " . $e->getMessage()];
    echo json_encode($error);
}

?>