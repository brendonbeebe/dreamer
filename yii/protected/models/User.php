<?php

/**
 * This is the model class for table "user".
 *
 * The followings are the available columns in table 'user':
 * @property integer $id
 * @property string $customer_id
 * @property integer $organization
 * @property string $first_name
 * @property string $last_name
 * @property string $email
 * @property string $password
 * @property string $token
 * @property string $last_login
 * @property integer $step_number
 * @property integer $jobprofile_step
 * @property string $phone
 * @property string $phone2
 * @property string $address
 * @property string $city
 * @property string $state
 * @property string $zip
 * @property integer $responsive
 * @property integer $assertive
 * @property string $date_joined
 * @property string $position
 *
 * The followings are the available model relations:
 * @property Organization $organization0
 */
class User extends CActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @param string $className active record class name.
	 * @return User the static model class
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
		return 'user';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('organization, step_number, jobprofile_step, responsive, assertive', 'numerical', 'integerOnly'=>true),
			array('customer_id, first_name, last_name, email, password, token, phone, phone2, address, city, state, zip', 'length', 'max'=>50),
			array('position', 'length', 'max'=>150),
			array('last_login, date_joined', 'safe'),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('id, customer_id, organization, first_name, last_name, email, password, token, last_login, step_number, jobprofile_step, phone, phone2, address, city, state, zip, responsive, assertive, date_joined, position', 'safe', 'on'=>'search'),
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
			'organization0' => array(self::BELONGS_TO, 'Organization', 'organization'),
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'customer_id' => 'Customer',
			'organization' => 'Organization',
			'first_name' => 'First Name',
			'last_name' => 'Last Name',
			'email' => 'Email',
			'password' => 'Password',
			'token' => 'Token',
			'last_login' => 'Last Login',
			'step_number' => 'Step Number',
			'jobprofile_step' => 'Jobprofile Step',
			'phone' => 'Phone',
			'phone2' => 'Phone2',
			'address' => 'Address',
			'city' => 'City',
			'state' => 'State',
			'zip' => 'Zip',
			'responsive' => 'Responsive',
			'assertive' => 'Assertive',
			'date_joined' => 'Date Joined',
			'position' => 'Position',
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
		$criteria->compare('customer_id',$this->customer_id,true);
		$criteria->compare('organization',$this->organization);
		$criteria->compare('first_name',$this->first_name,true);
		$criteria->compare('last_name',$this->last_name,true);
		$criteria->compare('email',$this->email,true);
		$criteria->compare('password',$this->password,true);
		$criteria->compare('token',$this->token,true);
		$criteria->compare('last_login',$this->last_login,true);
		$criteria->compare('step_number',$this->step_number);
		$criteria->compare('jobprofile_step',$this->jobprofile_step);
		$criteria->compare('phone',$this->phone,true);
		$criteria->compare('phone2',$this->phone2,true);
		$criteria->compare('address',$this->address,true);
		$criteria->compare('city',$this->city,true);
		$criteria->compare('state',$this->state,true);
		$criteria->compare('zip',$this->zip,true);
		$criteria->compare('responsive',$this->responsive);
		$criteria->compare('assertive',$this->assertive);
		$criteria->compare('date_joined',$this->date_joined,true);
		$criteria->compare('position',$this->position,true);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}