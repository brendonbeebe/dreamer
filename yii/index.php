<?php

// change the following paths if necessary
$yii=dirname(__FILE__).'/framework/yii.php';

if ( $_SERVER['HTTP_HOST'] == 'localhost' || $_SERVER['HTTP_HOST'] == 'beebe.asuscomm.com:8080') {

    $config = dirname(__FILE__) . '/protected/config/dev.php';
    // remove the following lines when in production mode
    defined('YII_DEBUG') or define('YII_DEBUG', true);
    // specify how many levels of call stack should be shown in each log message
    defined('YII_TRACE_LEVEL') or define('YII_TRACE_LEVEL', 3);

} else if ( $_SERVER['HTTP_HOST'] == 'test.persogenics.com') {

    $config = dirname(__FILE__) . '/protected/config/testServer.php';
    // remove the following lines when in production mode
    defined('YII_DEBUG') or define('YII_DEBUG', true);
    // specify how many levels of call stack should be shown in each log message
    defined('YII_TRACE_LEVEL') or define('YII_TRACE_LEVEL', 3);

} else {
    $config = dirname(__FILE__) . '/protected/config/main.php';
}



require_once($yii);
Yii::createWebApplication($config)->run();
