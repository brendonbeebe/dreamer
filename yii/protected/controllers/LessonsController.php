<?php
/**
 * Created by JetBrains PhpStorm.
 * User: beebe
 * Date: 1/16/14
 * Time: 9:53 PM
 * To change this template use File | Settings | File Templates.
 */


class LessonsController extends ERestController
{

    public $layout='//layouts/column2';
    public function filters()
    {
        // return the filter configuration for this controller, e.g.:
        return array('ApiAuth','accessControl');
    }
    public function accessRules()
    {

        return array(

            array('allow',
                'actions'=>array('CompleteLesson'),
                'users'=>array('@')
            ),
            array('deny',  // deny all users
                'users'=>array('*'),
            ),
        );
    }

    public function ActionCompleteLesson(){
        $lessonId = Yii::app()->request->getParam('id');
        $userModel = User::model()->findByPk(Yii::app()->user->id);

        if(empty($lessonId)){
            $this->ThrowError(array("General"=>array('Id required.')));
        }
        $lessonCompleted = new LessonsComplete;
        $lessonCompleted->lesson_id = $lessonId;
        $lessonCompleted->user_id= $userModel->id;

        if(!$lessonCompleted->save()){
            $this->ThrowError($lessonCompleted->getErrors());
        }




        $this->renderJson(array(
            'success'=>true,
        ));

    }

}
