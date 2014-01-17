<?php
Yii::setPathOfAlias('bootstrap', dirname(__FILE__).'/../extensions/bootstrap');
// uncomment the following to define a path alias
// Yii::setPathOfAlias('local','path/to/local-folder');
// Yii::setPathOfAlias('local','path/to/local-folder');

// This is the main Web application configuration. Any writable
// CWebApplication properties can be configured here.
return array(
    'theme'=>'bootstrap',
	'basePath'=>dirname(__FILE__).DIRECTORY_SEPARATOR.'..',
	'name'=>'My Web Application',

	// preloading 'log' component
	'preload'=>array('log'),

	// autoloading model and component classes
	'import'=>array(
		'application.models.*',
		'application.components.*',
        'ext.restfullyii.components.*',
        'ext.apiAuth.components.*',
        'ext.sendgrid.*',
        'application.components.Stripe.*',
        'application.models.*',
        'application.components.*',
	),

	'modules'=>array(
        'auth' => array(
            'strictMode' => true, // when enabled authorization items cannot be assigned children of the same type.
            'userClass' => 'User', // the name of the user model class.
            'userIdColumn' => 'id', // the name of the user id column.
            'userNameColumn' => 'email', // the name of the user name column.
            //'defaultLayout' => 'application.views.layouts.main', // the layout used by the module.
            'viewDir' => null, // the path to view files to use with this module.
        ),
	),

	// application components
	'components'=>array(
        'authManager' => array(

            'class'=>'auth.components.CachedDbAuthManager',
            'assignmentTable'=>'authassignment',
            'itemTable'=>'authitem',
            'itemChildTable'=>'authitemchild',
            'cachingDuration'=>3600,
            'behaviors' => array(
                'auth' => array(
                    'class' => 'auth.components.AuthBehavior'
                ),
            ),

        ),
        'db'=>array(
            'connectionString' => 'mysql:host=127.0.0.1;dbname=kiddreamer',
            'emulatePrepare' => true,
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8',
        ),
        'bootstrap'=>array(
            'class'=>'bootstrap.components.Bootstrap',
        ),
		'user'=>array(
			// enable cookie-based authentication
			'allowAutoLogin'=>true,
            'class' => 'auth.components.AuthWebUser'

		),

        'apiAuth' => array(
            'class' => 'ext.apiAuth.ApiAuth',

            // Below are the Extensions configurable attributes, specified with their default values.
            // The optional values can be left out of the configuration file (will get default values specified here)

            //'realm' => 'Restricted Area',                     //optional
            'protocol' => 'basic',                           //optional: 'basic' or 'digest' (recommended)
            'hash' => 'sha1',                                   //optional: empty or 'md5' (recommended. See comment on apiAuthPasswordAttribute)
            // The name of your (api) user model (i.e.: this can be your front-end User model, or a custom Api User model)
            'userClass' => 'User',                              //required
            // Let apiAuth know where to find required user model attributes
            'userIdAttribute' => 'id',                          //required
            'usernameAttribute' => 'email',                  //required, will be used for authentication, unless apiAuthUsernameAttribute is set.
            'passwordAttribute' => 'password',                  //required, will be used for authentication, unless apiAuthPasswordAttribute is set.
            //You can specify a different username for API authentication, which doesn't have to be the same as 'usernameAttribute'. When left unset, this value will be set to the same value as usernameAttribute
            'apiAuthUsernameAttribute' => 'email',           //optional, when left unset, this property will take it's value from 'usernameAttribute'
            // IMPORTANT note about 'apiAuthPasswordAttribute':
            // apiAuth uses the value of apiAuthPasswordAttribute for password verification.
            // It's property MUST be availble in the user model. It can be left empty or unspecified
            // in which case it will be set to the same value as 'passwordAttribute' when the extension is
            // initialized.
            //
            // Please note that there are specific requirements as to how passwords are stored:
            // * When using 'hash' => null, store the password in plain-text.
            // * When using 'hash' => 'md5', encrypt your passwords using:
            //
            //      $user->{apiAuthPasswordAttribute} = Yii::app()->apiAuth->encryptPassword($username, $password);
            //
            // The application's realm setting should NEVER be changed after storing digest encrypted passwords.
            // If the application's realm or the username changes, the encrypted password should be
            // updated as well, which shall be quite difficult to do if you don't have the unencrypted password.
            'apiAuthPasswordAttribute' => 'password',       //optional, when left unset, this property will take it's value from 'passwordAttribute'
            'activeAttribute' => null,                          //optional, specify your user models boolean 'is active' attribute if it has one. When the user's attribute evalutes to false, authentication will fail.
            'blockedAttribute' => null,                         //optional, specify your user models boolean 'is blocked' attribute if it has one. When the user's attribute evalutes to true, authentication will fail.
            // It is strongly recommended to leave the following setting on it's default value.
            // If you do override it, make sure you change it to a derived class of AUserIdentity.
            //'userIdentityClass' => 'AUserIdentity',           //optional
        ),

        'urlManager' => array(
            'urlFormat' => 'path',
            'showScriptName' => false,
            'rules' => array(
                'api/<controller:\w+>'=>array('<controller>/restList', 'verb'=>'GET'),
                'api/<controller:\w+>/<id:\w*>'=>array('<controller>/restView', 'verb'=>'GET'),
                'api/<controller:\w+>/<id:\w*>/<var:\w*>'=>array('<controller>/restView', 'verb'=>'GET'),
                'api/<controller:\w+>/<id:\w*>/<var:\w*>/<var2:\w*>'=>array('<controller>/restView', 'verb'=>'GET'),

                array('<controller>/restUpdate', 'pattern'=>'api/<controller:\w+>/<id:\w*>', 'verb'=>'PUT'),
                array('<controller>/restUpdate', 'pattern'=>'api/<controller:\w+>/<id:\w*>/<var:\w*>', 'verb'=>'PUT'),
                array('<controller>/restUpdate', 'pattern'=>'api/<controller:\w*>/<id:\w*>/<var:\w*>/<var2:\w*>', 'verb'=>'PUT'),

                array('<controller>/restDelete', 'pattern'=>'api/<controller:\w+>/<id:\w*>', 'verb'=>'DELETE'),
                array('<controller>/restDelete', 'pattern'=>'api/<controller:\w+>/<id:\w*>/<var:\w*>', 'verb'=>'DELETE'),
                array('<controller>/restDelete', 'pattern'=>'api/<controller:\w+>/<id:\w*>/<var:\w*>/<var2:\w*>', 'verb'=>'DELETE'),

                array('<controller>/restCreate', 'pattern'=>'api/<controller:\w+>', 'verb'=>'POST'),
                array('<controller>/restCreate', 'pattern'=>'api/<controller:\w+>/<id:\w+>', 'verb'=>'POST'),

                'site/page/<view:\w+>' => 'site/page/',
                '<controller:\w+>/<id:\d+>' => '<controller>/view',
                '<controller:\w+>/<action:\w+>/<id:\d+>' => '<controller>/<action>',
                '<controller:\w+>/<action:\w+>' => '<controller>/<action>',
            ),
        ),
//		'db'=>array(
//			'connectionString' => 'sqlite:'.dirname(__FILE__).'/../data/testdrive.db',
//		),
		// uncomment the following to use a MySQL database
		/*
		'db'=>array(
			'connectionString' => 'mysql:host=localhost;dbname=testdrive',
			'emulatePrepare' => true,
			'username' => 'root',
			'password' => '',
			'charset' => 'utf8',
		),
		*/
		'errorHandler'=>array(
			// use 'site/error' action to display errors
			'errorAction'=>'site/error',
		),
		'log'=>array(
			'class'=>'CLogRouter',
			'routes'=>array(
				array(
					'class'=>'CFileLogRoute',
					'levels'=>'error, warning',
				),
				// uncomment the following to show log messages on web pages
				/*
				array(
					'class'=>'CWebLogRoute',
				),
				*/
			),
		),
	),

	// application-level parameters that can be accessed
	// using Yii::app()->params['paramName']
	'params'=>array(
		// this is used in contact page
		'adminEmail'=>'webmaster@example.com',
        'rootAddress'=>'http://app.persogenics.com/',
        'stripeToken'=>"sk_test_Q9TUaOxsQ5L9htKKFdfN9XXF ",
        'capsuleToken'=>'7116474028440ee4d75585104720b574'
	),
);