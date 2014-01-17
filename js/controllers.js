'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngCookies']);

/*---------------------------------------
 LOGIN CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'LoginController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http){
        $scope.init = function(){
            $scope.loggedInError = undefined;
            if($cookieStore.get('authdata')){

                $location.path("/lessons");
            }

            //Load defaults

            //If current step is job profile
            //Depending on current jobprofile step load different defaults
        }


        $scope.init();
        $scope.$watch( function () { return userFactory.loggedInError; }, function (data) {
            $scope.loggedInError = data;
        }, true);

        $scope.attemptLogin = function(form){
            if (form.$valid) {

                var email = form.email;
                var password = form.password;

                userFactory.logIn(true,email,password);
            }

        }



    }
);


myApp.controller(
    'RegisterController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http){
        $scope.init = function(){
            $scope.registrationError = undefined;
            if($cookieStore.get('authdata')){

                $location.path("/lessons");
            }

            //Load defaults

            //If current step is job profile
            //Depending on current jobprofile step load different defaults
        }

        $scope.init();
        $scope.$watch( function () { return userFactory.loggedInError; }, function (data) {
            $scope.loggedInError = data;
        }, true);

        $scope.attemptRegistration = function(){
            var form = $scope.register_form
            
            if (form.$valid) {
                
                var email = $scope.register.email
                var password = $scope.register.password
                
                $http.post('yii/user/registeruser', $scope.register).success(function(data) {
                    userFactory.logIn(true,email,password);
                });
                
            }

        }



    }
);


myApp.controller(
    'BusinessPlanController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http){
        $scope.init = function(){
            $scope.plan = {};
            $scope.plan.suppliesneeded = [];
        }


        $scope.init();


        $scope.addItem = function(){
            $http.post('yii/BusinessPlan/AddItem',$scope.newsupply).success(function(response){
                $scope.plan.suppliesneeded.push(response.data);
            })
        }
        $scope.finishplan = function(){
            $scope.submitted = true;
//            $existingPlan->activities = $data['activities'];
//            $existingPlan->customer= $data['customer'];
//            $existingPlan->summary= $data['summary'];
//            $existingPlan->value= $data['value'];
            var summary = $scope.plan.description + " " + $scope.plan.whystart;
            var activities = $scope.plan.servicedesc  +" "+ $scope.plan.prdtosell;
            var customer = $scope.plan.customer;
            var value = $scope.plan.prdtosell;

            $http.post('yii/BusinessPlan/SaveBusinessPlan',{
                "activities":activities,
                "customer":customer,
                "summary":summary,
                "value":value
            }).success(function(){

                });
        };




    }
);


myApp.controller(
    'HeaderController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http, $state){
        $scope.init = function(){
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.profile = data;
            }, true)
        }


        $scope.init();
        $scope.addItem = function(){
            $http.post('yii/BusinessPlan/AddItem',$scope.newsupply).success(function(response){
                $scope.plan.suppliesneeded = response.data;
            })
        }
        $scope.finishplan = function(){
            $scope.submitted = true;
        };

        $scope.logout = function() {
            userFactory.logOut();
            $state.transitionTo('index');
        };


    }
); 


myApp.controller(
    'ProfileController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http, $state){

        // TODO: would this go in a directive?
        $scope.states = [
            {name: 'Alabama', value: 'AL'},
            {name: 'Alaska', value: 'AK'},
            {name: 'Arizona', value: 'AZ'},
            {name: 'Arkansas', value: 'AR'},
            {name: 'California', value: 'CA'},
            {name: 'Colorado', value: 'CO'},
            {name: 'Connecticut', value: 'CT'},
            {name: 'Delaware', value: 'DE'},
            {name: 'District of Columbia', value: 'DC'},
            {name: 'Florida', value: 'FL'},
            {name: 'Georgia', value: 'GA'},
            {name: 'Hawaii', value: 'HI'},
            {name: 'Idaho', value: 'ID'},
            {name: 'Illinois', value: 'IL'},
            {name: 'Indiana', value: 'IN'},
            {name: 'Iowa', value: 'IA'},
            {name: 'Kansas', value: 'KS'},
            {name: 'Kentucky', value: 'KY'},
            {name: 'Louisiana', value: 'LA'},
            {name: 'Maine', value: 'ME'},
            {name: 'Maryland', value: 'MD'},
            {name: 'Massachusetts', value: 'MA'},
            {name: 'Michigan', value: 'MI'},
            {name: 'Minnesota', value: 'MN'},
            {name: 'Mississippi', value: 'MS'},
            {name: 'Missouri', value: 'MO'},
            {name: 'Montana', value: 'MT'},
            {name: 'Nebraska', value: 'NE'},
            {name: 'Nevada', value: 'NV'},
            {name: 'New Hampshire', value: 'NH'},
            {name: 'New Jersey', value: 'NJ'},
            {name: 'New Mexico', value: 'NM'},
            {name: 'New York', value: 'NY'},
            {name: 'North Carolina', value: 'NC'},
            {name: 'North Dakota', value: 'ND'},
            {name: 'Ohio', value: 'OH'},
            {name: 'Oklahoma', value: 'OK'},
            {name: 'Oregon', value: 'OR'},
            {name: 'Pennsylvania', value: 'PA'},
            {name: 'Rhode Island', value: 'RI'},
            {name: 'South Carolina', value: 'SC'},
            {name: 'South Dakota', value: 'SD'},
            {name: 'Tennessee', value: 'TN'},
            {name: 'Texas', value: 'TX'},
            {name: 'Utah', value: 'UT'},
            {name: 'Vermont', value: 'VT'},
            {name: 'Virginia', value: 'VA'},
            {name: 'Washington', value: 'WA'},
            {name: 'West Virginia', value: 'WV'},
            {name: 'Wisconsin', value: 'WI'},
            {name: 'Wyoming', value: 'WY'}
        ];

        $scope.infoEditToggle = function () {
            $scope.profile.infoEdit = !$scope.profile.infoEdit;
            if (!$scope.profile.infoEdit) {
                // save info
                userFactory.saveCurrentUser();
            }
        };


        $scope.init = function(){
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.profile = data;
                $scope.processLessonsComplete();
            }, true)
        }
        
        $scope.processLessonsComplete = function(){
            $scope.lessonsCompleted = {};
            angular.forEach($scope.profile.lessonsComplete,function(value,key){
                $scope.lessonsCompleted[value.lesson_id] = value;
            });
        }


        $scope.init();


        $scope.finishplan = function(){
            $scope.submitted = true;
        };

        $scope.isCurrent = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            if (lessonNumber == 1 && $scope.lessonsCompleted[lessonNumber] == null) {
                return true;
            } else {
                
                if ($scope.lessonsCompleted[lessonNumber - 1] != null && $scope.lessonsCompleted[lessonNumber] == null) {
                    return true;
                }
                 
            }
            
            return false;
        }
        
        $scope.isComplete = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            return $scope.lessonsCompleted[lessonNumber] != null;
        }
        
        $scope.isIncomplete = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            if ( !$scope.isCurrent(lessonNumber) && $scope.lessonsCompleted[lessonNumber] == null ) {
                return true;
            }
            
            return false;
        }
        
        $scope.navigate = function(state) {
            console.log(state);
            $state.transitionTo(state);
        }
        
        var isLessonsSet = function() {
            return ($scope.profile != undefined && $scope.lessonsCompleted != undefined);
        }
        
    }
);

myApp.controller(
    'QuizController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http,$state){
        $scope.init = function(){

        }


        $scope.init();


        $scope.grade = function(){
            if($scope.quiz.question1 != 1)
                return false;
            if($scope.quiz.question2 != 2)
                return false;
            if($scope.quiz.question3 != 3)
                return false;


            return true;
        }
        $scope.submit = function(id){
            $scope.submitted = true;

            var allCorrect = $scope.grade();
            if(!allCorrect){
                $scope.error = "You missed one.";
            } else {
                $scope.error = "";

                if($scope.quiz.$valid){
                    $http.get('yii/lessons/CompleteLesson',{
                        params: {
                            id:id
                        }
                    }).success(function(){
                            userFactory.getUserInfo(false);

                            $state.transitionTo("lessons");
                        });
                }
            }

        };




    }
);

myApp.controller(
    'LessonsController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http){
        $scope.init = function(){
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.profile = data;
                $scope.processLessonsComplete();
            }, true)
        }


        $scope.processLessonsComplete = function(){
            $scope.lessonsCompleted = {};
            angular.forEach($scope.profile.lessonsComplete,function(value,key){
                $scope.lessonsCompleted[value.lesson_id] = value;
            });
        }

        $scope.isCurrent = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            if (lessonNumber == 1 && $scope.lessonsCompleted[lessonNumber] == null) {
                return true;
            } else {
                
                if ($scope.lessonsCompleted[lessonNumber - 1] != null && $scope.lessonsCompleted[lessonNumber] == null) {
                    return true;
                }
                 
            }
            
            return false;
        }
        
        $scope.isComplete = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            return $scope.lessonsCompleted[lessonNumber] != null;
        }
        
        $scope.isIncomplete = function(lessonNumber) {
            if ( !isLessonsSet() ) { return false; }
            
            var lessons = $scope.lessonsCompleted;
            if ( !$scope.isCurrent(lessonNumber) && $scope.lessonsCompleted[lessonNumber] == null ) {
                return true;
            }
            
            return false;
        }
        
        $scope.navigate = function(state) {
            $state.transitionTo(state);
        }
        
        var isLessonsSet = function() {
            return ($scope.profile != undefined && $scope.lessonsCompleted != undefined);
        }

        $scope.init();

    }
);
