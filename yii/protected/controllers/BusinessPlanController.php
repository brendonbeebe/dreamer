<?php

class BusinessPlanController extends ERestController
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

            array('allow',
                'actions'=>array('AddItem','GetBusinessPlan','SaveBusinessPlan','GetPlan','GetAll'),
                'users'=>array('@'),
            ),
            array('deny',  // deny all users
                'users'=>array('*'),
            ),
        );
    }


    public function ActionGetAll(){
        $allProjects = BusinessPlan::model()->findAll("1");

        $returnObject = array();
        foreach($allProjects as $project){
            $tempProject = array();
            $tempProject['picture'] = $project->user->profile_pic;
            $tempProject['name'] = $project->user->first_name . " " .$project->user->last_name;
            $tempProject['raised'] = $project->raised;
            $tempProject['business_name'] = $project->name;
            $tempProject['id'] = $project->id;
            $returnObject[] = $tempProject;
        }

        $this->renderJson(array(
            'success'=>true,
            'data'=>$returnObject
        ));
    }

    public function ActionGetBusinessPlan(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        $existingPlan = BusinessPlan::model()->find("user_id = :id",array(":id"=>$userModel->id));
        if(empty($existingPlan)){
            $this->renderJson(array(
                'success'=>true
            ));
        } else {
            $this->renderJson(array(
                'success'=>true,
                'data'=>$existingPlan
            ));
        }

    }

    public function ActionGetPlan(){

        $planId = Yii::app()->request->getParam('id');
        $planModel = BusinessPlan::model()->find("id = :id",array(":id"=>$planId));
        if(!empty($planModel)){
            $userModel = User::model()->findByPk($planModel->user_id);

            $this->renderJson(array(
                'success'=>true,
                'data'=>$planModel,
                'user'=>$userModel
            ));
        }
    }

    public function ActionSaveBusinessPlan(){
        $userModel = User::model()->findByPk(Yii::app()->user->id);
        $post = file_get_contents("php://input");
        //decode json post input as php array:
        $data = CJSON::decode($post, true);


        $existingPlan = BusinessPlan::model()->find("user_id = :id",array(":id"=>$userModel->id));
        if(empty($existingPlan)){
            $existingPlan = new BusinessPlan;
            $existingPlan->user_id = $userModel->id;
            $existingPlan->save();
        }

        $existingPlan->activities = $data['activities'];
        $existingPlan->customer= $data['customer'];
        $existingPlan->summary= $data['summary'];
        $existingPlan->value= $data['value'];
        $existingPlan->user_id= $userModel->id;

        if($existingPlan->save()){
            $this->renderJson(array(
                'success'=>true
            ));
        } else {
            $this->ThrowError($existingPlan->getErrors());
        }


    }

    public function ActionAddItem(){
        $planId = Yii::app()->request->getParam('id');
        $userModel = User::model()->findByPk(Yii::app()->user->id);

        $post = file_get_contents("php://input");

        //decode json post input as php array:
        $data = CJSON::decode($post, true);

        $existingPlan = BusinessPlan::model()->find("user_id = :id",array(":id"=>$userModel->id));
        if(empty($existingPlan)){
            $existingPlan = new BusinessPlan;
            $existingPlan->user_id = $userModel->id;
            $existingPlan->save();
        }

        $model = new BusinessItems;
        $model->cost = $data['cost'];
        $model->item= $data['name'];
        $model->business_id= $existingPlan->id;
        $model->save();

        $this->renderJson(array(
            'success'=>true,
            'data'=>$data
        ));
    }

}
