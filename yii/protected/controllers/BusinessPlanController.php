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
                'actions'=>array('AddItem'),
                'users'=>array('@'),
            ),
            array('deny',  // deny all users
                'users'=>array('*'),
            ),
        );
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
