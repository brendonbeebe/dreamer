<?php
Yii::import('application.extensions.mandrill.*');
require_once('Mandrill.php');



class UserController extends ERestController
{
	/**
	 * @var string the default layout for the views. Defaults to '//layouts/column2', meaning
	 * using two-column layout. See 'protected/views/layouts/column2.php'.
	 */
	public $layout='//layouts/column2';

    public function filters()
    {
        // return the filter configuration for this controller, e.g.:
        return array('accessControl');
    }
    public function accessRules()
    {

        return array(

            array('allow',  // allow all users to perform 'index' and 'view' actions
                'actions'=>array('StartSubscription','RegisterGroupUser','Login','index','view','CreateUser','NotifyUser','RegisterUser','UserInfo','SaveUserInfo','SavePassword','RegisterOrganizationUser','NotificationSeen','logOut','SendForgotPasswordEmail','ForgotPassword'),
                'users'=>array('*'),
            ),
            array('allow',
                'actions'=>array('restList', 'restView','create','update','GetMyNotifications','UserInfo'),
                'roles'=>array('Applicant'),
            ),
            array('allow',
                'actions'=>array('restCreate', 'restUpdate', 'restDelete','admin','delete','createnewuser','GetDashboardInfo'),
                'roles'=>array('Company Recruiter'),
            ),
            array('allow',
                'actions'=>array('SubscriptionDetails'),
                'roles'=>array('Company Admin'),
            ),
            array('allow',
                'actions'=>array(''),
                'roles'=>array('Super Admin'),
            ),
            array('deny',  // deny all users
                'users'=>array('*'),
            ),
        );
    }



    public function actionSubscriptionDetails(){
        $userModel = User::model()->find("id = :id",array(":id"=>Yii::app()->user->id));
        $subscriptions = $userModel->organizationRelation->subscriptionOrganization;

        $returnObject = array();
        foreach($subscriptions as $subscription){
            if($subscription->sub_id== 1){
                $returnObject['hire']['tier'] = $subscription->planName;
                $returnObject['hire']['price'] = $subscription->monthlyRate;
            } elseif($subscription->sub_id == 2){
                $returnObject['retain']['tier'] = $subscription->planName;
                $returnObject['retain']['price'] = $subscription->monthlyRate;
            }
        }

        $this->renderJson(array(
            'success'=>true,
            'data'=>$returnObject
        ));
    }
    public function actionNotificationSeen(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        $notification_id =  Yii::app()->request->getParam('notification_id');
        if(empty($userModel)){
            $message = "User is not logged in.";
            $this->renderJson(array(
                'success'=>false,
                'message'=>$message
            ));
            return;
        }



        $notification = UserNotify::model()->findByPk($notification_id);
        $notification->status = 1;
        $notification->save();
        $message = "Notification Seen.";
        $this->renderJson(array(
            'success'=>true,
            'message'=>$message
        ));
    }
    public function actionGetMyNotifications(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(empty($userModel)){
            $message = "User is not logged in.";
            $this->renderJson(array(
                'false'=>true,
                'message'=>$message
            ));
            return;
        }

        $criteria = new CDbCriteria();
        $criteria->order = "status ASC";
        $criteria->with = "notify";
        $criteria->condition = "status = 0 && user_id = ".$userModel->id ;
        $allModel = UserNotify::model()->findAll($criteria);

        $returnObject = array();
        foreach($allModel as $model ){
            $returnObject[] = array(
                "id" => $model->id,
                "status" => $model->status,
                "text" => $model->notify->notification_text,
                "name"=>$model->notify->name
            );
        }


        $this->renderJson(array(
            'success'=>"true",
            'data'=>array(
                'totalCount'=>1,
                'data'=>$returnObject
            )
        ));

    }
    public function actionCreateUser(){
        $model = new User;
        $email = $_REQUEST['email'];
        $password = $_REQUEST['password'];
        $model->email = $email;
        $model->password =Yii::app()->apiAuth->encryptPassword($email, $password);
        $model->save();
    }

    public function actionNotifyUser(){
        $user_id = $_REQUEST['id'];
        $userModel = User::model()->findByPk($user_id);
        if(!empty($userModel)){
            $email = $userModel->email;
            $first_name= $userModel->first_name;
            $last_name= $userModel->last_name;
        } else{
            return;
        }

        $mandrill = new Mandrill();
        $template_name = "job-profile-notification";
        $template_content = array();
        $template_content[] = array(
            "name"=>"first_name",
            "content"=>$first_name . " ".$last_name
        );
        $to = array();
        $to [] = array(
            "email"=>$email,
            "name"=>$first_name . " ".$last_name
        );
        $message = array(
            "subject"=>"Request to Participate in a Job Profile",
            "to"=> $to
        );
        $mandrill->messages->sendTemplate($template_name, $template_content, $message);

        $message = "The user was notified by email.";
        $this->renderJson(array(
            'success'=>"Success",
            'message'=>$message
        ));

        $userModel = User::model()->find("email = :email",array(":email"=>$email));
        if(!empty($userModel)){
            $userModel->addNotification(8);
        }
    }

    public function actionCreateNewUser(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(empty($userModel)){
            $message = "User is not logged in.";
            $this->renderJson(array(
                'false'=>true,
                'message'=>$message
            ));
            return;
        }


        $model = new User;
        $email = $_REQUEST['email'];
        $model->email = $email;
        $model->first_name = $_REQUEST['first_name'];
        $model->last_name = $_REQUEST['last_name'];
        $model->organization = $userModel->organization;
        $model->position = $_REQUEST['position'];

        //Create random password
        $password = $this->randomPassword();
        $model->password =Yii::app()->apiAuth->encryptPassword($email, $password);
        if(!$model->save()){
            $this->renderJson(array(
                'success'=>false,
                'data'=>$model->getErrors()
            ));
            return;
        }

        $am = Yii::app()->getAuthManager();
        $am->assign("Employee", $model->id);


        //Assign the new user to the default group
        $group = Yii::app()->request->getParam('group','');
        if(empty($group)){
            $model->assignToGroupId(null);
        } else {
            $model->assignToGroupId($group);
        }


        $message ="";
        $success = true;
        if($model->save()){
            $email = $model->email;
            $first_name= $model->first_name;
            $last_name= $model->last_name;

            $type = Yii::app()->request->getParam('type',"");
            $mandrill = new Mandrill();
            if($type == "newAdmin"){
                $template_name = "new-admin";
            } else if($type == "newEmployee"){
                $template_name = "new-employee";
            }else{
                $template_name = "job profile invite";
                $model->addNotification(8);
            }

            $template_content = array();
            $template_content[] = array(
                "name"=>"first_name",
                "content"=>$first_name
            );
            $template_content[] = array(
                "name"=>"email",
                "content"=>$email
            );
            $template_content[] = array(
                "name"=>"org_id",
                "content"=>$model->organizationRelation->unique_org_id
            );
            $template_content[] = array(
                "name"=>"password",
                "content"=>$password
            );
            $to = array();
            $to [] = array(
                "email"=>$email,
                "name"=>$first_name . " ".$last_name
            );
            $message = array(
                "to"=> $to
            );



            $mandrill->messages->sendTemplate($template_name, $template_content, $message);
            $message = "The new user was created successfully.";
        }else{
            $message = $model->getErrors();
            $success = false;
            unset($model);
        }


        $this->renderJson(array(
            'success'=>$success,
            'message'=>$message,
            'data'=>array(
                'totalCount'=>1,
                'data'=>$this->allToArray($model)
            )
        ));

    }
    private function getJobFitAttempt($userId){

        $quizAttempt = QuizAttempt::model()->find("user_id = :user_id AND type = 'application'",array(":user_id"=>$userId));

        return $quizAttempt;
    }
    public function actionSendForgotPasswordEmail(){
        $email = Yii::app()->request->getParam('email');
        $organization_id = Yii::app()->request->getParam('org_id');
        $organization = Organization::model()->find("unique_org_id = :id",array(":id"=>$organization_id));
        if(!empty($organization))
            $userModel = User::model()->find("email = :email AND organization = :organization_id",array(":email"=>$email,":organization_id"=>$organization->id));

        $success = true;

        if(!empty($userModel)){
            $forgotHash = new ForgotPassword;
            $forgotHash->user_id = $userModel->id;
            //Set expiration to +1 day
            $forgotHash->expire =  date('Y-m-d H:i:s', time()+ (24 * 60 * 60));
            $forgotHash->hash = uniqid();
            if($forgotHash->save()){
                $mandrill = new Mandrill();
                $template_name = "forgot-password";
                $template_content = array();
                $template_content[] = array(
                    "name"=>"first_name",
                    "content"=>$userModel->first_name
                );
                $template_content[] = array(
                    "name"=>"last_name",
                    "content"=>$userModel->last_name
                );
                $template_content[] = array(
                    "name"=>"change_pass_link",
                    "content"=>Yii::app()->params->rootAddress."#/forgotpassword/".$forgotHash->hash
                );


                $to = array();
                $to [] = array(
                    "email"=>$userModel->email,
                    "name"=>$userModel->first_name . " ".$userModel->last_name
                );
                $message = array(
                    "to"=> $to
                );
                $mandrill->messages->sendTemplate($template_name, $template_content, $message);

            } else {

                //$message = $forgotHash->getErrors();
            }
        } else {
            $success = true;
        }

        $message = "Email Sent";
        $password = $this->randomPassword();
        $this->renderJson(array(
            'success'=>$success,
            'message'=>$message
        ));

        //$model->password =Yii::app()->apiAuth->encryptPassword($email, $password);
        //$model->save();
    }

    public function actionGetDashboardInfo(){
        //Get total number of applicants
        //Get total number of active Jobs
        //Get total number of applicants who have status hired
        //Get all applicants who are tier1/2/3
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(empty($userModel))
            throw new CHttpException(403,'Must Login.');

        /*
         * Calculate all the stats required in the dashboard
         */
        $hasFinishedJobProfile = false;
        $jobProfileToFinish = -1; //Should be the id of the profile we want to finish
        $showDashboard = false;
        $hasCreatedJob = false;
        $totalActiveJobs = 0;
        $totalHired = 0;
        $totalApplicants = 0;
        $totalTier1 = $totalTier2 = $totalTier3 = 0;
        foreach($userModel->organizationRelation->with("applicants")->jobs as $job){
            $hasCreatedJob = true;
            //This information is used for the "Getting Started" menu
            if($job->profile_finished == 'Y')
                $hasFinishedJobProfile = true;
            else if($job->active == 'Y' && $job->deleted != 'Y')
                $jobProfileToFinish = $job->id;

            //Show the dashboard once the organization has created a job
            $showDashboard = true;
            if($job->active == 'Y' && $job->deleted != 'Y')
                $totalActiveJobs++;
            else
                continue;
            /*
             * Get stats for the applicants
             */
            foreach($job->applicants as $applicant){
                if($applicant->status == 'waiting'){
                    $totalApplicants++;
                    $tier = $applicant->applicant->getTier($job->assertive+$job->responsive);
                    if($tier == 1)
                        $totalTier1++;
                    else if($tier == 2)
                        $totalTier2++;
                    else if($tier == 3)
                        $totalTier3++;
                } else if($applicant->status == 'hired'){
                    $totalHired++;
                }
            }
        }

        /*
         * Calculate the progress made
         */

        $steps = array(
          "register"=>true,
          "complete_profile"=>!$userModel->organizationRelation->missingData(),
          "create_job"=>$hasCreatedJob,
          "complete_job_profile"=> array(
              "hasFinishedJobProfile" => $hasFinishedJobProfile,
              "jobProfileToFinish" =>$jobProfileToFinish
          )
        );





        $returnObject = array();
        $returnObject['totalApplicants'] = $totalApplicants;
        $returnObject['totalActiveJobs'] = $totalActiveJobs;
        $returnObject['totalHired'] = $totalHired;
        $returnObject['totalTier1'] = $totalTier1;
        $returnObject['totalTier2'] = $totalTier2;
        $returnObject['totalTier3'] = $totalTier3;
        $returnObject['showDashboard'] = $showDashboard;
        $returnObject['steps'] = $steps;

        $this->renderJson(array(
            'success'=>true,
            'data'=>$returnObject
        ));

    }

    public function actionForgotPassword(){
        $hash = Yii::app()->request->getParam('hash');
        $password = Yii::app()->request->getParam('password');

        $forgotPassword = ForgotPassword::model()->find("hash = :hash",array(":hash"=>$hash));
        $message = "";
        $success = true;
        //If request is not expired and not used
        if($forgotPassword->expire > date('Y-m-d H:i:s', time()) && $forgotPassword->used != 'Y'){
            $userModel = User::model()->find("id = :id",array(":id"=>$forgotPassword->user_id));
            $userModel->password =Yii::app()->apiAuth->encryptPassword($userModel->email, $password);
            if($userModel->save()){
                $forgotPassword->used = 'Y';
                $forgotPassword->save();

                $message = "Password reset";
            } else {
                $this->ThrowError(array("General"=>array('Unable to find the user, please check your url or generate a new one.')));
            }
        } else {
            $this->ThrowError(array("General"=>array('This link has expired or has already been used')));
        }


        $this->renderJson(array(
            'success'=>$success,
            'message'=>$message
        ));
    }

    public function actionLogout(){
        if(Yii::app()->user->logout()){
            $this->renderJson(array(
                'success'=>'true',
                'message'=>"User was logged out correctly."
            ));
        }

    }
    private function login(){
        //parse headers
        if(!isset($_SERVER['PHP_AUTH_USER']))
            return false;


        $identity=new UserIdentity($_SERVER['PHP_AUTH_USER'],$_SERVER['PHP_AUTH_PW']);

        $identity->authenticate();
        if($identity->errorCode===UserIdentity::ERROR_NONE)
        {
            Yii::app()->user->allowAutoLogin = true;
            Yii::app()->user->login($identity,86400*7);
            return true;
        }
        else
            return false;
    }
    public function actionLogin(){

        return $this->login();
    }
    public function actionUserInfo(){
        if(Yii::app()->user->getIsGuest() && !$this->login()){
            throw new CHttpException(403,'Must Login.');
        }


        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(empty($userModel)){
            $message = "User is not logged in.";
            $this->renderJson(array(
                'false'=>true,
                'message'=>$message
            ));
            return;
        }
        $success = true;
        $message = "User is logged in.";



        if(!Yii::app()->user->isGuest){
            $user = array(
                "id"=>Yii::app()->user->id,
                "email"=>$userModel->email,
                "first_name"=>$userModel->first_name,
                "last_name"=>$userModel->last_name,
                "phone"=>$userModel->phone,
                "phone2"=>$userModel->phone2,
                "address"=>$userModel->address,
                "city"=>$userModel->city,
                "state"=>$userModel->state,
                "zip"=>$userModel->zip
            );



            $this->renderJson(array(
                'success'=>$success,
                'message'=>$message,
                'data'=>array(
                    'totalCount'=>1,
                    'data'=>$user
                )
            ));
        }
        else{
            $message = "User is not logged in.";
            $this->renderJson(array(
                'false'=>true,
                'message'=>$message
            ));
        }



        //echo var_dump(Yii::app()->user);
    }
    public function actionSavePassword(){
        $password = Yii::app()->request->getParam('password');
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(empty($userModel) || empty($password) ){
            throw new CHttpException(500,'Unable to complete request.');
        }
        $newPassword = Yii::app()->apiAuth->encryptPassword($userModel->email,$password);
        $userModel->password = $newPassword;
        if($userModel->save()){
            $mandrill = new Mandrill();
            $template_name = "profile-change";
            $template_content = array();
            $template_content[] = array(
                "name"=>"first_name",
                "content"=>$userModel->first_name
            );
            $template_content[] = array(
                "name"=>"last_name",
                "content"=>$userModel->last_name
            );
            $template_content[] = array(
                "name"=>"field_changed",
                "content"=>"password"
            );


            $to = array();
            $to [] = array(
                "email"=>$userModel->email,
                "name"=>$userModel->first_name . " ".$userModel->last_name
            );
            $message = array(
                "to"=> $to
            );
            $mandrill->messages->sendTemplate($template_name, $template_content, $message);
        } else {
            throw new CHttpException(500,'Unable to complete request.');
        }
    }
    public function actionSaveUserInfo(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        if(!Yii::app()->user->isGuest){
            $post = file_get_contents("php://input");

            //decode json post input as php array:
            $data = CJSON::decode($post, true);

            $userModel->id =Yii::app()->user->id;
            if($userModel->email != $data['email'])
                $sendConf = true;
            $oldEmail = $userModel->email;
            $userModel->email =$data['email'];
            $userModel->first_name =$data['first_name'];
            $userModel->last_name =$data['last_name'];
            $userModel->organization =$data['organization'];
            $userModel->phone =$data['phone'];
            $userModel->phone2 =$data['phone2'];
            $userModel->address =$data['address'];
            $userModel->city =$data['city'];
            $userModel->state =$data['state'];
            $userModel->zip =$data['zip'];

            if($userModel->save()){
                $message = "Model was saved.";
                if(!empty($sendConf)){
                    $mandrill = new Mandrill();
                    $template_name = "profile-change";
                    $template_content = array();
                    $template_content[] = array(
                        "name"=>"first_name",
                        "content"=>$userModel->first_name
                    );
                    $template_content[] = array(
                        "name"=>"last_name",
                        "content"=>$userModel->last_name
                    );
                    $template_content[] = array(
                        "name"=>"field_changed",
                        "content"=>"email"
                    );


                    $to = array();
                    $to [] = array(
                        "email"=>$data['email'],
                        "name"=>$userModel->first_name . " ".$userModel->last_name
                    );
                    $to [] = array(
                        "email"=>$oldEmail,
                        "name"=>$userModel->first_name . " ".$userModel->last_name
                    );
                    $message = array(
                        "to"=> $to
                    );
                    $mandrill->messages->sendTemplate($template_name, $template_content, $message);
                }
            } else {
                $errors = $userModel->getErrors();
                $message = $errors;
            }



            $this->renderJson(array(
                'success'=>true,
                'message'=>$message
            ));
        }
        else{
            $message = "User is not logged in.";
            $this->renderJson(array(
                'false'=>true,
                'message'=>$message
            ));
        }
    }
    public function actionRegisterGroupUser(){
        Yii::app()->user->logout();
        $post = file_get_contents("php://input");

        //decode json post input as php array:
        $data = CJSON::decode($post, true);

        $group = Groups::model()->findByPk($data['group_id']);

        //A uniqid of -1 means registration is turned off and noone should be registering
        if($group->uniqid == -1)
            return;


        $newUser = new User;
        $newUser->first_name = $data['first_name'];
        $newUser->last_name= $data['last_name'];
        $newUser->email= $data['email'];
        $newUser->organization = $group->org_id;
        $newUser->password= Yii::app()->apiAuth->encryptPassword($data['email'], $data['password']);
        if(!$newUser->save()){
            $this->ThrowError($newUser->getErrors());

        }
        $newUser->assignToGroupId($group->id);
        $am = Yii::app()->getAuthManager();
        $am->assign("Employee", $newUser->id);
    }

    public function actionRegisterOrganizationUser(){
        Yii::app()->user->logout();
        $post = file_get_contents("php://input");

        //decode json post input as php array:
        $data = CJSON::decode($post, true);


        //Check that organization id is unique
        $newOrganization = Organization::model()->findByAttributes(array("unique_org_id"=>$data['unique_org_id']));
        //$newOrganization = Organization::model()->findAllByAttributes(array("unique_org_id"=>$data['unique_org_id']));

        if(!empty($newOrganization))
            $this->ThrowError(array("organization_id"=>array('Duplicate organization id, pick another.')));

        $newOrganization = new Organization;
        $newOrganization->name = $data['org_name'];
        $newOrganization->unique_org_id = $data['unique_org_id'];
        $newOrganization->phone = $data['phone'];
        $newOrganization->reference = $data['reference'];
        $newOrganization->size = $data['size'];
        $newOrganization->save();
        $newOrganization->createDefaults();


        $newUser = new User;
        $newUser->first_name = $data['first_name'];
        $newUser->last_name= $data['last_name'];
        $newUser->email= $data['email'];
        $newUser->organization = $newOrganization->id;
        $newUser->password= Yii::app()->apiAuth->encryptPassword($data['email'], $data['password']);
        $success = true;

        if($newUser->save()){
            //$newUser->addToCRM();

            //Subscribe to default
            $newUser->subscribe(1,date( 'Y-m-d',time()+86400*14) );
            $newUser->subscribe(2,date( 'Y-m-d',time()+86400*14));
            $am = Yii::app()->getAuthManager();
            $am->assign("Company Admin", $newUser->id);


            $mandrill = new Mandrill();
            $template_name = "new-organization-register";
            $template_content = array();
            $template_content[] = array(
                "name"=>"first_name",
                "content"=>$newUser->first_name
            );
            $template_content[] = array(
                "name"=>"email",
                "content"=>$newUser->email
            );
            $template_content[] = array(
                "name"=>"org_id",
                "content"=>$newUser->organizationRelation->unique_org_id
            );
            $to = array();
            $to [] = array(
                "email"=>$newUser->email,
                "name"=>$newUser->first_name . " ".$newUser->last_name
            );
            $message = array(
                "to"=> $to
            );


            $mandrill->messages->sendTemplate($template_name, $template_content, $message);



            $message = "User was created.";
        } else {
            $this->ThrowError($newUser->getErrors());

            $success = false;
            $errors = $newUser->getErrors();
            $message = $errors;
        }


        $this->renderJson(array(
            'success'=>$success,
            'message'=>$message
        ));
    }

    public function actionRegisterUser(){
        Yii::app()->user->logout();
        $post = file_get_contents("php://input");

        //decode json post input as php array:
        $data = CJSON::decode($post, true);



        $newUser = new User;
        $newUser->first_name = $data['first_name'];
        $newUser->last_name= $data['last_name'];
        $newUser->email= $data['email'];

        $newUser->password= Yii::app()->apiAuth->encryptPassword($data['email'], $data['password']);

        $success = true;

        if($newUser->save()){
            $am = Yii::app()->getAuthManager();
            $am->assign("Applicant", $newUser->id);

            $mandrill = new Mandrill();
            $template_name = "new-registration";
            $template_content = array();
            $template_content[] = array(
                "name"=>"first_name",
                "content"=>$newUser->first_name
            );
            $template_content[] = array(
                "name"=>"email",
                "content"=>$newUser->email
            );
            $to = array();
            $to [] = array(
                "email"=>$newUser->email,
                "name"=>$newUser->first_name . " ".$newUser->last_name
            );
            $message = array(
                "to"=> $to
            );


            $mandrill->messages->sendTemplate($template_name, $template_content, $message);


            $message = "User was created.";
        } else {
            $success = false;
            $errors = $newUser->getErrors();
            $message = $errors;
        }


        //Create quiz attempt
        $jobFitTest = new QuizAttempt;
        $jobFitTest->user_id = $newUser->id;
        $jobFitTest->quiz_id = 2;
        $jobFitTest->type = 'application';
        $jobFitTest->save();



        $this->renderJson(array(
            'success'=>$success,
            'message'=>$message
        ));

    }

    private function randomPassword() {
        $alphabet = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
        $pass = array(); //remember to declare $pass as an array
        $alphaLength = strlen($alphabet) - 1; //put the length -1 in cache
        for ($i = 0; $i < 8; $i++) {
            $n = rand(0, $alphaLength);
            $pass[$i] = $alphabet[$n];
        }
        return implode($pass); //turn the array into a string
    }
	/**
	 * Returns the data model based on the primary key given in the GET variable.
	 * If the data model is not found, an HTTP exception will be raised.
	 * @param integer $id the ID of the model to be loaded
	 * @return user the loaded model
	 * @throws CHttpException
	 */
	public function loadModel($id)
	{
		$model=user::model()->findByPk($id);
		if($model===null)
			throw new CHttpException(404,'The requested page does not exist.');
		return $model;
	}

	/**
	 * Performs the AJAX validation.
	 * @param user $model the model to be validated
	 */
	protected function performAjaxValidation($model)
	{
		if(isset($_POST['ajax']) && $_POST['ajax']==='user-form')
		{
			echo CActiveForm::validate($model);
			Yii::app()->end();
		}
	}
    /* Column based filter, what columns can a user see? */
    public function addSecurityFilters(){
        $userModel = User::model()->find("id = :id",array(":id"=>Yii::app()->user->getId()));
        if(!empty($userModel)){
            $this->restFilter = '[{"property": "organization", "value" : '.$userModel->organization.', "operator": "="}]';
        } else {
             $this->restFilter = '[{"property": "organization", "value" : -1, "operator": "="}]';
        }
        return $this->restFilter;
    }
    public function actionGetBilling() {

    }

    private function getPlanID($retain,$hire){
        if($retain == 0){
            if($hire==1)
                $plan = 'hire_monthly_tier1';
            if($hire==2)
                $plan = 'hire_monthly_tier2';
            if($hire==3)
                $plan = 'hire_monthly_tier3';
        } else if($hire == 0){
            if($retain==1)
                $plan = 'retain_monthly_tier1';
            if($retain==2)
                $plan = 'retain_monthly_tier2';
            if($retain==3)
                $plan = 'retain_monthly_tier3';
        } else if($hire >0 && $hire <=3 && $retain > 0 && $retain<=3){
            $plan = 'c_retain'.$retain.'_hire'.$hire;
        } else {
            return false;
        }
        return $plan;
    }
    public function actionStartSubscription() {
        $retain = Yii::app()->request->getParam('retain','');
        $hire = Yii::app()->request->getParam('hire','');
        $stripeToken = Yii::app()->request->getParam('stripeToken','');
        $plan = $this->getPlanID($retain,$hire);

        $user_id = Yii::app()->user->getId();
        $user_model = User::model()->find("id = :user_id",array(":user_id"=>$user_id));

        if ($user_model->customer_id == 0) {

            Stripe::setApiKey(Yii::app()->params['stripeToken']);


            /*
             * c_retain1_hire1
             *
             * retain_monthly_tier1
             *
             * hire_monthly_tier1
             */
            $customer = Stripe_Customer::create(array(
                    "plan" => $plan,
                    "email" => $user_model->email,
                    "card" => $stripeToken)
            );
            $values = $customer->getValues();
            $user_model->customer_id = $values['id'];
            $user_model->save();

            if(!empty($retain)){
                $user_model->subscribe(1,date( 'Y-m-d',time()+86400*365),$retain);
            }
            if(!empty($hire)){
                $user_model->subscribe(2,date( 'Y-m-d',time()+86400*365),$hire);
            }

        }

    }




}
