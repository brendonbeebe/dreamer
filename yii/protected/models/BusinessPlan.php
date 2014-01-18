<?php

/**
 * This is the model class for table "business_plan".
 *
 * The followings are the available columns in table 'business_plan':
 * @property integer $id
 * @property integer $user_id
 * @property string $name
 * @property string $summary
 * @property string $type
 * @property string $value
 * @property string $customer
 * @property string $activities
 * @property string $start_date
 * @property integer $supporters
 * @property integer $raised
 *
 * The followings are the available model relations:
 * @property BusinessItems[] $businessItems
 * @property User $user
 */
class BusinessPlan extends CActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @param string $className active record class name.
	 * @return BusinessPlan the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}

	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'business_plan';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('value, customer, activities, raised', 'required'),
			array('user_id, supporters, raised', 'numerical', 'integerOnly'=>true),
			array('name', 'length', 'max'=>50),
			array('summary, type, value, customer, activities', 'length', 'max'=>500),
			array('start_date', 'safe'),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('id, user_id, name, summary, type, value, customer, activities, start_date, supporters, raised', 'safe', 'on'=>'search'),
		);
	}

	/**
	 * @return array relational rules.
	 */
	public function relations()
	{
		// NOTE: you may need to adjust the relation name and the related
		// class name for the relations automatically generated below.
		return array(
			'businessItems' => array(self::HAS_MANY, 'BusinessItems', 'business_id'),
			'user' => array(self::BELONGS_TO, 'User', 'user_id'),
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'user_id' => 'User',
			'name' => 'Name',
			'summary' => 'Summary',
			'type' => 'Type',
			'value' => 'Value',
			'customer' => 'Customer',
			'activities' => 'Activities',
			'start_date' => 'Start Date',
			'supporters' => 'Supporters',
			'raised' => 'Raised',
		);
	}

	/**
	 * Retrieves a list of models based on the current search/filter conditions.
	 * @return CActiveDataProvider the data provider that can return the models based on the search/filter conditions.
	 */
	public function search()
	{
		// Warning: Please modify the following code to remove attributes that
		// should not be searched.

		$criteria=new CDbCriteria;

		$criteria->compare('id',$this->id);
		$criteria->compare('user_id',$this->user_id);
		$criteria->compare('name',$this->name,true);
		$criteria->compare('summary',$this->summary,true);
		$criteria->compare('type',$this->type,true);
		$criteria->compare('value',$this->value,true);
		$criteria->compare('customer',$this->customer,true);
		$criteria->compare('activities',$this->activities,true);
		$criteria->compare('start_date',$this->start_date,true);
		$criteria->compare('supporters',$this->supporters);
		$criteria->compare('raised',$this->raised);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}