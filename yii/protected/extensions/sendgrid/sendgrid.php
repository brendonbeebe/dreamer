<?php
/**
 * SendGrid CApplicationComponent class 
 * 
 * SendGrid Web PHP API ...
 * this class is mainly a wrapper to Alon Ben David's SendGrid PHP API
 * https://github.com/alonbendavid/SendGrid-PHP-Library
 *
 * Copyright (C) 2012  Giuliano Iacobelli
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/gpl-3.0.txt>.
 *
 * This is extension implements, SendGrid Web API and Newsletter 
 * based on your main.php component's settings and returns it
 * 
 * @author Giuliano Iacobelli <giuliano.iacobelli@stamplay.com>
 * @package application.extensions.sendgrid
 * @version 1.0
 */

Yii::import("ext.sendgrid.sendgridWeb");
Yii::import("ext.sendgrid.sendgridNewsletter");
class sendgrid extends CApplicationComponent {

	
	// set the consumer key and secret
    public $config = array();
    
    /**
     * @var string SendGrid username
     */    
    public $sg_user;

    /**
     * @var string SendGrid api key
     */    
    public $sg_api_key;
        
    /**
     * @var bool instance of the SendGrid library
     */
    private $_sendGridWeb;
    
    /**
     * @var bool instance of the SendGrid library
     */
    private $_sendGridNewsletter;
	
	/**
	 * Returns services settings declared in the authorization classes.
	 * For perfomance reasons it uses Yii::app()->cache to store settings array.
	 * @return array services settings.
	 */
	public function getConfig() {
		if (Yii::app()->hasComponent('cache'))
			$config = Yii::app()->cache->get('SendGrid.config');
		if (!isset($config) || !is_array($config)) {
			$config = array();
			foreach ($this->config as $configElem => $value) {
				$config[$configElem] = $value;
			}
			if (Yii::app()->hasComponent('cache'))
				Yii::app()->cache->set('SendGrid.config', $config);
		}
		return $config;
	}
		
    /**
     * @throws CException if the SendGrid Web PHP SDK cannot be loaded
     * @return instance of SendGrid PHP SDK class
     */
    protected function _getSendGridWeb()
    {        
        if (is_null($this->_sendGridWeb)) {
            if ($this->sg_user && $this->sg_api_key) {            
                $this->_sendGridWeb = new sendgridWeb($this->sg_user,$this->sg_api_key); 
                
            } else {
                if (!$this->sg_user)
                    throw new SendGridException('SendGrid user ID not specified.');
                elseif (!$this->sg_api_key)
                    throw new SendGridException('SendGrid api key not specified.');
            }
        }
        if(!is_object($this->_sendGridWeb)) {
            throw new SendGridException('SendGrid Web API could not be initialized.');
        }

        return $this->_sendGridWeb;
    }	
	

    /**
     * @throws CException if the SendGrid Web PHP SDK cannot be loaded
     * @return instance of SendGrid PHP SDK class
     */
    protected function _getSendGridNewsletter()
    {        
        if (is_null($this->_sendGridNewsletter)) {
            if ($this->sg_user && $this->sg_api_key) {            
                $this->_sendGridNewsletter = new sendgridNewsletter($this->sg_user,$this->sg_api_key); 
                
            } else {
                if (!$this->sg_user)
                    throw new SendGridException('SendGrid user ID not specified.');
                elseif (!$this->sg_api_key)
                    throw new SendGridException('SendGrid api key not specified.');
            }
        }
        if(!is_object($this->_sendGridNewsletter)) {
            throw new SendGridException('SendGrid Newsletter API could not be initialized.');
        }
        return $this->_sendGridNewsletter;
    }	
		

		
	/**
	 * This function allows you to send email.
	 * @param string/array $to - This can also be passed in as an array, to send to multiple locations
	 * @param string/array $toname - Must be a string. If to parameter is an array, toname must be an array with the exact number of array elements as the to field 
	 * @param array $xsmtpapi - PHP headers - check here: http://docs.sendgrid.com/documentation/api/smtp-api/
	 * @param string $subject - The subject of your email
	 * @param string $html - The actual content of your email message. HTML for the user to display
	 * @param string $text - The actual content of your email message. TEXT for the user to display
	 * @param string $from - This is where the email will appear to originate from for your recipient
	 * @param string $bcc - This can also be passed in as an array of email addresses for multiple recipients
	 * @param string $fromname - This is name appended to the from email field. IE – Your name or company name
	 * @param string $replyto - Append a reply-to field to your email message
	 * @param string $date - Specify the date header of your email. One example: “Thu, 21 Dec 2000 16:01:07 +0200″. PHP developers can use:date(‘r’);
	 * @param array $headers - PHP headers - check here: http://docs.sendgrid.com/documentation/api/smtp-api/
	 * @param array $files - an array of file names and paths
	 * 		EX: $files = array('filename1' => 'filepath' , 'filename2' => 'filepath2',);
	 *
	 * @return array The parsed response, or NULL if there was an error
	*/	
	public function sendMail($to , $toname = '' , $xsmtpapi = '' , $subject , $html , $text , $from , $bcc ='' , $fromname='' , $replyto='' , $date='' , $files='' , $headers='') {

		return $this->_getSendGridWeb()->mail_send($to , $toname, $xsmtpapi, $subject , $html , $text , $from , $bcc, $fromname, $replyto, $date, $files, $headers); 			
		
	}
    public function sendMailShort($to , $toname = '' , $subject , $html ) {

        return $this->_getSendGridWeb()->mail_send_short($to , $toname, $subject , $html);

    }
}


/**
 * The SendGridException exception class.
 * 
 * @author Giuliano Iacobelli <me@giulianoiacobelli.com>
 * @package application.extensions.sendgrid
 * @version 1.0
 */
class SendGridException extends CException {}