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

/*---------------------------------------
 Dashboard CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'DashboardController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http,$rootScope){
        $scope.dashboard = {};

        $scope.init = function(){
            $http.get('yii/User/GetDashboardInfo').success(function(response){
                $scope.dashboard = response.data;
                $scope.steps = $scope.dashboard.steps;
                $rootScope.$broadcast("event:reloadGraph");
            });
        }


        // these are temp numbers to demonstrate how the graphs are populated
        var activeJobs = 3;
        var totalHired = 6;
        var tier1 = 12;
        var tier2 = 14;
        var tier3 = 18;
        var tier4 = 3;
        var total = tier1 + tier2 + tier3 + tier4;

        $scope.tier1 = [$scope.dashboard.totalTier1, $scope.dashboard.totalApplicants];
        $scope.tier2 = [$scope.dashboard.totalTier2, $scope.dashboard.totalApplicants];
        $scope.tier3 = [$scope.dashboard.totalTier3, $scope.dashboard.totalApplicants];


        // if amount of analytics are insufficeint, then it doesn't show
        $scope.analytics = false;

        $scope.init();



    }
);




/*---------------------------------------
 MAIN CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'MainController',
    function($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory,$http,orgFactory){
        //setRootScope($rootScope, Restangular);




        //If news jobs are added or deleted refresh the list
        $scope.jobs = {};
        $scope.org = {};
        $scope.organization = {};
        $scope.notifications = [];
        $scope.$watch( function () { return jobFactory.getJobs(); }, function (data) {
            $scope.jobs = data;
        }, true);
        $scope.$watch( function () { return jobFactory.notifications; }, function (data) {
            $scope.notifications = data;
        }, true);
        $scope.$watch( function () { return orgFactory.org; }, function (data) {
            $scope.org=data;
            $scope.organization = data;
        }, true);



        $scope.$on('jobDeleted', function(event, track) {
            // assign the loaded track as the 'current'
            jobFactory.setJobs(baseJobs.getList());
        });
        $scope.notificationSeen = function(id, index){
            $http.get("yii/User/NotificationSeen",{
                params:{
                    "notification_id":id
                }
            }).then(function(data){
                jobFactory.notifications.splice(index,1);
            });
        }

        $scope.first_name = userFactory.user.first_name;
        $scope.last_name = userFactory.user.last_name;
        $rootScope.$on('event:userinfoloaded', function(event,e) {
            $scope.first_name = userFactory.user.first_name
            $scope.last_name = userFactory.user.last_name;
            $scope.email = userFactory.user.email;
            $scope.user_id = userFactory.user.id;
        });


        $scope.fillForm = function(jobName){
            $scope.job.title = jobName;

        };

        $scope.logOut =function(){
            userFactory.logOut();
        }
        $scope.addJob = function(job){

            $.colorbox.close();
            if(job.name == ""){
                job.name = "default";
            }
            if(job.positionsToFill == ""){
                job.positionsToFill = 3;
            }
            job.organization_id = userFactory.user.organization;


            //Add new job to database
            baseJobs.post(job).then(function(result){
                $.colorbox.close();
                jobFactory.setSelected(result[0]);
                jobFactory.setJobs(baseJobs.getList());
                $location.path("/jobs/"+result[0].id);
            });
           // $scope.toggle();
            //$scope.jobs = baseJobs.getList();


            return job;
        };

        $scope.openNewJobLightBox = function(){

        }

        $scope.selectJob = function(job){
            jobFactory.setSelected(job);


            ////Clear search box and toggle menu
            //$scope.toggle();
            //$scope.jobName = "";

        };

        $scope.submitFeedback = function(){
            if($scope.feedbackform.$valid == true){

                $http.post('yii/Notify/SubmitFeedback',{
                    "type":$scope.feedbackform.type.$viewValue,
                    "message":$scope.feedbackform.question.$viewValue,
                    "priority":$scope.feedbackform.type.$viewValue=="problem"?"urgent":"low",
                    "requester":$scope.email,
                    "subject": $('.feedback-select option:selected').html(),
                    "org": $scope.org.name,
                    "org_id": $scope.org.unique_org_id,
                    "user_id": $scope.user_id
                }).success(function(){
                        $scope.fb=false;
                        $scope.feedbackform.type = "";
                        $scope.feedbackform.type.$viewValue = "";
                        $scope.feedbackform.question = "";
                        $scope.feedbackform.question.$viewValue = "";
                    });
            }

        }


        var baseJobs = Restangular.all('job');

    }
);


/*---------------------------------------
 JOBS CONTROLLER
 ---------------------------------------*/
myApp.controller(
    "jobProfileController",
    function($scope, jobFactory, $route,Restangular,$stateParams,$cookieStore,$rootScope,$location,$state,$http,userFactory,Popup,dropDownFactory){
        /*****************************************************/
        /*
         * Methods to work on job profile hiring team
         */

        //Called when adding a new member who is also a new user.  Shows a colorbox asking for more infromation about the new user.
        $scope.addMemberDetail = function(term){
            $scope.$apply(function(){
                $scope.member = {};
                $scope.member.name = term;
            });

            $.colorbox(
                {
                    href:"#lightbox2",
                    inline:true,
                    width:"550px",
                    transition: "fade",
                    overlayClose: false,
                    speed: 0,
                    scrolling: false,
                    opacity:.5,
                    height: 380,
                    className: "colormebox"


                }
            );


        }


        //Adds a new member to job profile. Along with adding a new member it creates a new quiz attempt
        //member = member object
        //createUser = true|false; If true it creates a new user and sends them a random password
        $scope.addMember = function(member,createUser){
            //If create user is set, create a new user with a Random password by calling the correct api.
            //Add the new users id to job.hiringTeam
            if( $scope.job.hiringTeam == undefined){
                $scope.job.hiringTeam = [];
            }
            if($scope.job.hiringTeam.length >= 3){
                Popup.alert("Error", "Only 3 members are allowed on a hiring team.", "Okay", "", $scope, {});
                return;
            }

            var user_id;
            var quiz_id = 1; //1==skill assessment

            $scope.job.profile_finished = 'N';

            if(createUser){

                $http({
                    url: "yii/user/createNewUser",
                    method: "GET",
                    params: {email: member.email,first_name: member.first_name,last_name: member.last_name}
                }).
                    success(function(data, status, headers, config) {
                        if(data.data.email!=undefined){
                            $scope.error = data.data.email[0];
                            return;
                        }
                        $.colorbox.close();
                        // this callback will be called asynchronously
                        // when the response is available
                        var response = data.data.data;
                        user_id = response.id;

                        //Create quiz attempt
                        if(user_id != undefined || user_id != ""){
                            $http({
                                url: "yii/QuizAttempt/AddTeamMember",
                                method: "POST",
                                params: {user_id: user_id,job_id: $scope.job.id}
                            }).
                                success(function(data, status, headers, config) {
                                    dropDownFactory.refreshUsers();

                                    // this callback will be called asynchronously
                                    // when the response is available
                                    $scope.job.hiringTeam.push(
                                        data.data

                                    );

                                });

                        }




                    });

            } else {

                $http({
                    url: "yii/QuizAttempt/AddTeamMember",
                    method: "POST",
                    params: {user_id: member,job_id: $scope.job.id}
                }).
                    success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        $scope.job.hiringTeam.push(
                            data.data
                        );


                    }).error(function(data){
                        Popup.alert("Error", data, "K, Gotcha!", "", $scope, {});
                    });

            }

        }

        //Deletes the member form the hiring team
        //member = member object
        $scope.removeHiringMember = function(member){

            //Remove
//            console.log("REMOVE",$scope.job.hiringTeam[member]);
//            //Should remove the consensus and the users own quiz
//
//
//            $scope.job.descriptors = undefined;
//
//
//            //Remove the consensus
//            var quizConsensus = _.findWhere($scope.job.quizAttempts,{"type":"consensus"});
//            if(quizConsensus != undefined){
//
//                var quizConsensusId =quizConsensus.id;
//                Restangular.one('QuizAttempt',quizConsensusId).remove();
//
//            }
//
//
//            //Remove the members quiz attempt
//
//
//            var membersConsensus = _.findWhere($scope.job.quizAttempts,{"user_id":$scope.job.hiringTeam[member].id});
//            if(membersConsensus != undefined){
//                var membersConsensusID =membersConsensus.id;
//                Restangular.one('QuizAttempt',membersConsensusID).remove();
//            }


            $http.get("yii/QuizAttempt/RemoveHiringMember",{
                params:{
                    "user_id":$scope.job.hiringTeam[member].id,
                    "job_id":$scope.job.id
                }
            })

            //$scope.job.descriptors = undefined;
            $scope.job.hiringTeam.splice(member,1);
            $scope.job.profile_finished = 'N';
        };
        $scope.resetConsensus =function(){
            $http.get("yii/Job/ResetJobConsensus",{
                params:{
                    "job_id":$scope.job.id
                }
            }).success(function(){
                    if($scope.job.profile_finished != 'N')
                        $scope.job.profile_finished = 'N';
                    else
                        jobFactory.reloadJob();

                });
        }

        //Calls the rest api to send an email to the specified member
        //member = member object
        $scope.notifyHiringMember = function(member){

            $http({
                url: "yii/user/NotifyUser",
                method: "GET",
                params: {"id":member.id}
            }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available


                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        //Checks if the hiring team is within the size constraints
        $scope.isHiringTeamLargeEnough = function(){
            if($scope.job==undefined || $scope.job.hiringTeam ==undefined)
                return false;
            return ($scope.job.hiringTeam.length > 0 && $scope.job.hiringTeam.length <= 3);
        }

        //Checks that each member in the hiring team has taken the assessment
        $scope.isHiringTeamFinished = function(){
            var finished = true;
            if($scope.job.hiringTeam == undefined){
                finished = false;
                return false;
            }

            angular.forEach($scope.job.hiringTeam, function(response, key){
                if(response.quiz != undefined && response.quiz.status != "Finished"){
                    finished = false;
                } else if(response.quiz == undefined ) {
                    finished = false;
                }

            });

            return finished;
        }

        //Checks if user can proceed past the hiring team step
        $scope.canMovePastHiringTeam = function(){
            var result = $scope.isHiringTeamLargeEnough() && $scope.isHiringTeamFinished();
            return result;
        }

        /* End of methods to work on job profile hiring team*/
        /*****************************************************/


            //Sets the current profile step so that next time a user logs in he will start off where he left
        $scope.nextJobProfileStep = function(markAsUnfinished){
            if(markAsUnfinished){
                $scope.job.profile_finished = 'N';
            }

            if($scope.job.jobprofile_step == undefined){
                $scope.job.jobprofile_step = 1;
            }
            if($scope.job.jobprofile_step < 4){
                $scope.setJobProfileStep(parseInt($scope.job.jobprofile_step) + 1);
            }
        }



        $scope.finishJobProfile = function(){
            $scope.job.jobprofile_step =4;

            //If the job profile wasn't reset and it's not marked as finished
            //Then mark it as finished and save the descriptors

            if($scope.job.profile_finished != 'Y'){
                $scope.job.profile_finished='Y';
                $http({
                    url: "yii/JobDescriptor/SaveJobDescriptors?job_id="+$scope.job.id,
                    method: "POST",
                    data: $scope.descriptors
                }).success(function(data){
                        $scope.job.descriptors = $scope.descriptors;
                        jobFactory.reloadJob();
                    });
            }


            //$scope.loadDefaultInterviewQuestions();

            //$location.path("/jobs/"+$scope.job.id+"/ad_generator");
        }
        $scope.setJobProfileStep = function(step){
            //If the job profile page is changing load the correct content
            $scope.error = "";
            if(step == 2){
                $scope.loadConsensus();
            } else if(step == 3){
                if($scope.job.jobprofile_step < 3 && ($scope.consensusChanged == true || $scope.firstLoadOfConsensus == true)){
                    $scope.consensusChanged = false;
                    var allFilled = true;
                    var missingAnswers = [];
                    _.forEach($scope.consensus,function(value,key){
                        if(value.choiceId == ""){
                            allFilled = false;
                            missingAnswers.push(key);
                        }
                    });

                    if(allFilled){
                        $scope.saveConsensus();
                    } else {
                        $scope.error = "Error - Please fill out the entire consensus before continuing.";
                        return;
                    }


                } else  if($scope.job.jobprofile_step >= 3){
                    if(!savingConsensus)
                        $scope.getDescriptors();
                } else {
                    $scope.getDescriptors();
                }

            }

            $scope.job.jobprofile_step = step;
        }
        $scope.loadConsensus = function(){

            $http({
                url: "yii/QuizAttempt/CompareAssessments",
                method: "GET",
                params: {
                    job_id: $scope.job.id,
                    quiz_id: "1"
                }
            }).
                success(function(data, status, headers, config) {
                    $scope.firstLoadOfConsensus = true;
                    var response = data.data.data;
                    var numberDisagreed = 0;
                    var isConsensus = false;
                    $scope.consensus = response;
                    for (var k in response) {
                        if (response.hasOwnProperty(k) && response[k].agree == false) {
                            numberDisagreed ++;
                        }
                        if(response[k].consensus){
                            isConsensus = true;
                            $scope.firstLoadOfConsensus = false;
                        }
                    }
                    $scope.isConsensus = isConsensus;
                    $scope.consensusLength = numberDisagreed;


                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }
        $scope.consensusChanged = false;
        $scope.markConsensusChange =function(){
            if($scope.isConsensus && $scope.consensusChanged == false)
                $scope.consensusChanged = true;
        }
        var savingConsensus = false;

        $scope.saveConsensus = function(){
            savingConsensus = true;
            //Added the following two lines because the job would change from SaveConsensus
            //The job would then overwire those changes because it wasn't updated locally.
            $scope.job.assertive = undefined;
            $scope.job.responsive = undefined;
            $http.post('yii/QuizAttempt/SaveConsensus?job_id='+$scope.job.id
                    ,$scope.consensus).success(function (data) {



                    $scope.descriptors = undefined;
                    var quizConsensus = _.findWhere($scope.quizAttempts,{"type":"consensus"});
                    if(quizConsensus == undefined)
                        $scope.quizAttempts.push({"id":data.created_id,"type":"consensus"});
                    $scope.descriptorsLoaded = false;
                    $scope.getDescriptors();
                    //jobFactory.reloadJob();
                }).error(function(data){
                    savingConsensus = false
                });

        }

        $scope.getDescriptors = function(){

            $http.post('yii/Descriptor/GetDescriptorsWSelected?job_id='+$scope.job.id).success(function (data) {
                $scope.descriptors = data.data.data;
                $scope.numberOfDescriptors = data.data.totalCount;
                if($scope.descriptors.length == 0){
                    //$scope.getDescriptors();
                } else {
                    $scope.descriptorsLoaded = true;
                }
                savingConsensus = false

            }).error(function(d){
                    savingConsensus = false
                });

            //if($scope.descriptorsLoaded != undefined && $scope.descriptorsLoaded == true){
//
            //} else {
            //    $scope.calculateDescriptors();
            //}

        }

        $scope.deleteAllInterviews = function(){
            $http({
                url: "yii/job/ClearInterviewQuestions",
                method: "GET",
                params: {
                    job_id: $scope.job.id
                }
            }).success(function(data, status, headers, config) {

                    $scope.job.interviewQuestions = undefined;
                });
        }
        $scope.areyousure = function(desc_id){
            $scope.job.profile_finished = 'N';

            $scope.deleteAllInterviews();
            $scope.toggleDescriptor(desc_id);
        };
        /*
         * Toggle a descriptor only if < 10 are selected
         */
        $scope.toggleDescriptor = function(desc_id){

            if($scope.job.profile_finished == 'Y'){
                var popupOptions = {};
                Popup.confirm("Are You Sure?", "If you go ahead with this change it will reset your interview.  Are you sure you want to change the descriptor?",
                    undefined, "areyousure("+desc_id+")",
                    undefined, undefined,
                    $scope, popupOptions);
            } else {
                var currentDescriptor = _.findWhere($scope.descriptors,{"id":desc_id});
                if(currentDescriptor == undefined)
                    return;
                if(currentDescriptor.selected == undefined || currentDescriptor.selected == false){
                    if($scope.numberOfDescriptors < 10){
                        $scope.numberOfDescriptors++;
                        currentDescriptor.selected = !currentDescriptor.selected;
                    }
                }else if(currentDescriptor.selected){
                    currentDescriptor.selected = !currentDescriptor.selected;
                    $scope.numberOfDescriptors--;
                }

            }

        }

        $scope.formatHiringTeam = function(){
            //Put assessment id into hiringTeam
            var job = $scope.job;

            _.forEach(job.hiringTeam, function(user, key) {

                var assessment = _.find($scope.quizAttempts,function(quizAttempt){
                    return quizAttempt.user_id == user.id;
                });

                if(assessment != undefined){
                    user.quiz = {};
                    user.quiz.id = assessment.id;
                    user.quiz.status = assessment.status;
                    user.quiz.mine = (assessment.user_id == userFactory.getUserId());
                }


            });
        }

        $scope.graph = {};
        $scope.graph.assertive = 0;
        $scope.graph.responsive = 0;
        $scope.init = function(){
            //Get the quiz attempts
            $scope.quizAttempts = {};
            $scope.descriptors = dropDownFactory.dropdown.descriptors;
            //Make rest call

            $scope.$watch( function () { return jobFactory.selectedJob}, function (data) {
                if(data != undefined ){
                    $rootScope.$broadcast("event:reloadGraph");
                    $scope.job = data;
                    $scope.graph.assertive = data.assertive;
                    $scope.graph.responsive = data.responsive;


                    $scope.setJobProfileStep($scope.job.jobprofile_step);
                    Restangular.all('QuizAttempt').getList({"job":data.id}).then(function(response) {
                        $scope.quizAttempts = response;
                        $scope.formatHiringTeam();
                    });

                    $http.post('yii/Descriptor/GetDescriptorsWSelected?job_id='+data.id).success(function (data) {
                        if(data.data == undefined)
                         return;
                        $scope.descriptors = data.data.data;
                        $scope.numberOfDescriptors = data.data.totalCount;
                        if($scope.descriptors.length == 0){
                            $scope.getDescriptors();
                        } else {
                            $scope.descriptorsLoaded = true;
                        }

                    });

                }
            }, true);
            //Get the descriptors
            $scope.descriptors = {};
        }



        $scope.setRedirectToProfile = function(){
            userFactory.setRedirect("/jobs/"+$scope.job.id+"/job_profile");
        }
        $scope.init();

    }
);

myApp.controller(
    "customizeInterviewController",
    function($scope, $http,jobFactory,Restangular){
        $scope.init = function(){
            $scope.$watch( function () { return jobFactory.selectedJob}, function (data) {
                if(data != undefined){
                    $http.get("yii/JInterviewQuestions/GetJobInterviewQuestions",{
                        params:{
                            job: data.id
                        }
                    }).success(function(response){
                            $scope.interviewQuestions = response.data;
                            _.forEach($scope.interviewQuestions,function(value,key){
                                if(value.interview_questions == value.original_question){
                                    value.interview_questions = "";
                                }
                            });
                        })

                }

            }, true);

        }

        $scope.init();
    });


myApp.controller(
    "adgenController",
    function($scope, $http,jobFactory){
        $scope.init = function(){
            $scope.$watch( function () { return jobFactory.selectedJob}, function (data) {
                if(data != undefined){
                    $http.post('yii/Descriptor/GetDescriptorsWSelected?job_id='+jobFactory.selectedJob.id).success(function (data) {
                        console.log("desc",$scope.descriptors);
                        $scope.descriptors = data.data.data;
                        $scope.numberOfDescriptors = data.data.totalCount;
                        $scope.generatedSentence = $scope.generateSentence();
                    });
                }

            }, true);

        }
        $scope.generateSentence = function(){
            var toString ="The candidate must be ";
            _.forEach($scope.descriptors,function(value,key){
                if(value.selected == true)
                    toString += value.word + ", ";
            });
            return toString;
        }
        $scope.init();
    });

myApp.controller(
    "jobsController",
    function($scope, jobFactory, $route,Restangular,$stateParams,$cookieStore,$rootScope,$location,$state,$http,userFactory,Popup,dropDownFactory){




        //$state.transitionTo('dashboard');
        /*
         Default behavior when page loads
         Set defaults for variables
         */
        $scope.consensus = {};
        $scope.memberCount = 0;
        $scope.seperator = "(";
        $scope.endseperator = ")";
        $scope.requiredQuestions = {};
        $scope.currentSkill ="";

        // not being used
        var baseSkills = Restangular.all('JSkill');

        function init(){
            if($stateParams.jobId != undefined && $stateParams.jobId!=""){
                jobFactory.loadJobID($stateParams.jobId);
            } else {
                $state.transitionTo("dashboard");
            }

            $scope.$watch( function () { return dropDownFactory.dropdown; }, function (data) {
                $scope.types = data.types;
                $scope.experiences = data.experiences;
                $scope.locations = data.locations;
                $scope.salaries = data.salaries;
                $scope.skills = data.skills;
                $scope.users = data.users;
                $scope.requiredQuestions = data.requiredQuestions;
                $rootScope.$broadcast('event:refreshChosen');

            }, true);
            $scope.$watch( function () { return jobFactory.selectedJob}, function (data) {
                if(data != undefined){
                    $scope.job = data;
                    $scope.updatejob = {};
                    $scope.updatejob.title = data.title;
                    $scope.updatejob.positionsToFill = data.positionsToFill * 1;
                }

            }, true);

        }


        $scope.editJobSave = function(){
            $scope.job.title = $scope.updatejob.title;
            $scope.job.positionsToFill = $scope.updatejob.positionsToFill;
            if($scope.job.positionsToFill > 0)
                $scope.job.active = 'Y';
            $.colorbox.close ();
        }
        $scope.inactivateJob = function(){
            $scope.job.positionsToFill = 0;
            $scope.job.active = 'N';
        }

        $scope.addSkill = function(skill){
            $scope.job.skills.push(skill);
        }
        $scope.deleteSkill = function(skill){
            $scope.job.skills.splice(skill,1);
        }

        $scope.deleteJob = function(){
            $scope.job.deleted = true;
            $scope.job.active = false;
            jobFactory.saveSelectedJob();
            $state.transitionTo("dashboard");
            jobFactory.setSelected(undefined);

        }

        $scope.$watch('job',function(newVal,oldVal){
            if(newVal != undefined && oldVal != undefined)
                jobFactory.saveSelectedJob();
        },true);









        init();
    }
);

/*---------------------------------------
 PROFILE CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'profileController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory,$http,Popup) {

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

        $scope.user = {};
        $scope.user.first_name = userFactory.user_first_name;

        //todo: temparary data - needs service



        $scope.infoEditToggle = function () {
            $scope.profile.infoEdit = !$scope.profile.infoEdit;
            if (!$scope.profile.infoEdit) {
                // save info
                userFactory.saveCurrentUser();
            }
        };

        $scope.email = {'email': 'brendon.beebe@gmail.com'};
        $scope.email.emailEdit = false;
        $scope.emailEditToggle = function () {
            $scope.email.emailEdit = !$scope.email.emailEdit;
            if (!$scope.email.emailEdit) {
                $scope.newinfo.emailConfirmation = "";
                $scope.newinfo.email = "";
            } else {
                // save new email
            }
        };

        $scope.password = {};
        $scope.password.passwordEdit = false;
        $scope.passwordEditToggle = function () {
            $scope.password.passwordEdit = !$scope.password.passwordEdit;
            if (!$scope.password.passwordEdit) {
                $scope.newinfo.password = "";
                $scope.newinfo.passwordConfirmation = "";
            } else {
                // save new password
            }
        }

        $scope.saveEmail = function(){console.log("hey");
            if($scope.newinfo.email == $scope.newinfo.emailConfirmation){
                userFactory.user.email = $scope.newinfo.emailConfirmation;
                userFactory.saveCurrentUser().success(function(data){
                    Popup.alert("Success", "Your Email was changed correctly.", "Okay", "", $scope, {});

                    if(data.message.email!=undefined)
                        $scope.error = data.message.email[0];
                    else
                        $scope.emailEditToggle();
                });

            } else {
                $scope.error = "Emails don't match";
            }
        }
        $scope.savePassword = function(){
            if($scope.newinfo.password == $scope.newinfo.passwordConfirmation){
                $http.get("yii/user/SavePassword",{
                    params: {"password":$scope.newinfo.passwordConfirmation}
                }).success(function(data){
                        Popup.alert("Success", "Your Password was changed correctly.", "Okay", "", $scope, {});
                    });
                $scope.passwordEditToggle();
            } else {
                $scope.error2 = "Passwords don't match";
            }
        }
        $scope.gotoAssessment = function(id){
            userFactory.setRedirect("/account");
            $location.path("/assessment/"+id);
        }
        $scope.init = function(){

            //Bind scope.profile to userFactory.user
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.profile = data;
                $scope.newinfo = {};
            })
            $http.get("yii/QuizAttempt/GetMyAttempts").success(function(data){
               $scope.attempts = data.data;
            });
        }
        $scope.init();


    });


/*---------------------------------------
 ORGANIZATION CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'organizationController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory,orgFactory) {
        $scope.options = {

            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            singleFileUploads:true,
            headers: {
                'Authorization': 'Basic ' + $cookieStore.get('authdata')
            }
        };
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


        $scope.error = {};


        $scope.orgEditToggle = function () {

            if ($scope.org.orgEdit) {
                // save organization info
                orgFactory.saveUserOrg().then(function(data){
                    $scope.org.orgEdit = !$scope.org.orgEdit;
                },function(data){
                    if(data.data.validation != undefined){
                        $scope.error.zip = data.data.validation.zip[0];

                    }

                });
            } else {

                $scope.org.orgEdit = !$scope.org.orgEdit;
            }
        }

        $scope.init = function(){

        }
        $scope.init();

        //Bind scope.profile to userFactory.user
        $scope.$watch( function () { return orgFactory.org; }, function (data){
            if(data != undefined){
                $scope.org = data;
            }
        })

        $scope.clearQueue = function(){
            $scope.queue = [];
        }
        $scope.$on('fileuploaddone',function(e,data){
            $scope.$apply(function(){
                $scope.org.logo = data.result.files[0].thumbnailUrl;
                $scope.queue = [];
                $.colorbox.close();

            })

        })
    });



/*---------------------------------------
 NOTIFICATIONS CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'notificationsController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory) {

        // todo: this is temparary data - needs service
        $scope.notifications = {
            'id1':'on',
            'id2':'off',
            'id3':'on',
            'id4':'off',
            'id5':'on'
        }
        $scope.notifyOff = function(id) {
            console.log('turn ' + id + ' off');
        }
        $scope.notifyOn = function(id) {
            console.log('turn ' + id + ' on');
        }
    }
);



/*---------------------------------------
 PERMISSIONS CONTROLLER

 Much of the code below is directly copied from the job profile hiring page
 I could have made it modular but it would have taken alot more time and testing
 It was easier to copy/paste the code and should be modified to be modular later on
 TODO: Make the user select box modular
 ---------------------------------------*/

myApp.controller(
    'permissionsController',
    function ($scope,$http,jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory,dropDownFactory) {
        //Called when adding a new member who is also a new user.  Shows a colorbox asking for more infromation about the new user.
        $scope.addMemberDetail = function(term){
            $scope.$apply(function(){
                $scope.member = {};
                $scope.member.name = term;
            });

            $.colorbox(
                {
                    href:"#lightbox2",
                    inline:true,
                    width:"550px",
                    transition: "fade",
                    overlayClose: false,
                    speed: 0,
                    scrolling: false,
                    opacity:.5,
                    height: 380,
                    className: "colormebox"


                }
            );


        }


        //member = member object
        //createUser = true|false; If true it creates a new user and sends them a random password
        $scope.addMember = function(member,createUser){
            //If create user is set, create a new user with a Random password by calling the correct api.
            //Add the new users id to job.hiringTeam
            if( $scope.administrators == undefined){
                $scope.administrators = [];
            }

            var user_id;


            if(createUser){

                $http({
                    url: "yii/user/createNewUser",
                    method: "GET",
                    params: {email: member.email,first_name: member.first_name,last_name: member.last_name,type:"newAdmin"}
                }).
                    success(function(data, status, headers, config) {
                        if(data.data.email!=undefined){
                            $scope.error = data.data.email[0];
                            return;
                        }
                        $.colorbox.close();
                        // this callback will be called asynchronously
                        // when the response is available
                        var response = data.data.data;
                        user_id = response.id;

                        //Create quiz attempt
                        if(user_id != undefined || user_id != ""){
                            $http({
                                url: "yii/Organization/AddAdministrators",
                                method: "POST",
                                params: {user_id: user_id}
                            }).
                                success(function(data, status, headers, config) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    $scope.administrators.push(
                                        data.data
                                    );
                                });

                        }




                    }).
                    error(function(data, status, headers, config) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                    });

            } else {

                $http({
                    url: "yii/Organization/AddAdministrators",
                    method: "POST",
                    params: {user_id: member}
                }).
                    success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        $scope.administrators.push(
                            data.data
                        );


                    });

            }

        }

        $scope.removeAdministrators = function(member,index){

            //TODO: this is old
            $http.get("yii/Organization/RemoveAdministrators",{
                params:{
                    "user_id":member
                }
            })

            //$scope.job.descriptors = undefined;
            $scope.administrators.splice(index,1);
        };

        $scope.administrators = [];
        $scope.init = function(){
            $http.get("yii/Organization/GetAdministrators").success(function(data){
                $scope.administrators = data.administrators;
            })
            $scope.$watch( function () { return dropDownFactory.dropdown; }, function (data) {
                $scope.users = data.users;
                $rootScope.$broadcast('event:refreshChosen');
            }, true);
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.user = data;
            }, true);
        }
        $scope.init();
    }
)



/*---------------------------------------
 BILLING CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'billingController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$http,userFactory) {
        $scope.init = function(){


        }
        $scope.init();
        $scope.$watch( function () { return userFactory.user; }, function (data) {



            if(data.id!=undefined){
                $http.get("yii/organization/GetSubscriptionDetails",{
                    params:{
                        org_id:userFactory.user.organization
                    }
                }).success(function(response){
                    $scope.planDetails = response.data;

                });

                $http.get("yii/organization/GetInvoices",{
                    params:{
                        org_id:userFactory.user.organization
                    }
                }).success(function(response){
                    $scope.invoices = response.data;console.log($scope.invoices );
                });
            }
        })
    }
);



/*---------------------------------------
    QUIZ CONTROLLER
---------------------------------------*/
myApp.controller(
    "quizController",
    function($scope,$stateParams,Restangular,$state,$http,userFactory,$location){
        $scope.quiz ={};
        $scope.currentQuestion = {};
        $scope.currentIndex = 0
        $scope.isNext = true;
        $scope.isPrev = false;
        $scope.isLastQuestion = false;
        $scope.quizFinished = false;
        $scope.isApplicant = false;

        /*
         * Called from an element to progress to the next or previous question.
         * Use with any html element
         * usage: data-ng-click="nextQuestion()"
         */

        $scope.nextQuestion = function(){
            if($scope.quizFinished){
                $scope.finishQuiz();
            }


            $scope.saveAnswer($scope.currentQuestion.response.answer_id);
            $scope.isLastQuestion = false;

            if($scope.isNext == true){
                $scope.currentIndex++;
                $scope.isPrev = true;
                $scope.saveCurrentStatus("In Progress",$scope.currentIndex + 1);
                if($scope.currentIndex >= $scope.quiz.quizQuestions.length - 1){
                    $scope.isNext = false;
                    $scope.isLastQuestion = true;
                }
            } else {
                //If they clicked finish
                if($scope.currentIndex == $scope.quiz.quizQuestions.length-1){
                    $scope.quizFinished = true;
                    $scope.saveCurrentStatus("Finished",$scope.currentIndex + 1);


                }
            }
            $scope.currentQuestion = $scope.quiz.quizQuestions[$scope.currentIndex];
        }
        $scope.prevQuestion = function(){
            $scope.quizFinished = false;
            if($scope.isPrev == true){
                $scope.currentIndex--;
                $scope.isNext = true;
                if($scope.currentIndex <= 0)
                    $scope.isPrev = false;

                $scope.saveCurrentStatus("In Progress",$scope.currentIndex+1);
            }
            $scope.currentQuestion = $scope.quiz.quizQuestions[$scope.currentIndex];
        }
        /* * * * * * * */


        /*
        * Save the currently selected answer to the rest api, should check for an existing answer first.
        *
        * Restangular.delete/id
        * Restangular.post/object
        *
         */
        $scope.saveAnswer = function(answer_id){
            //Save quiz_Attempt_id, question_id, answer_id
            var attemptID = $stateParams.quizAttemptId;
            var currentQuestionID = $scope.currentQuestion.id;
            var prevResponseID;
            angular.forEach($scope.quiz.quizAttemptResponses, function(response, key){
                if(response.question_id == currentQuestionID)
                    prevResponseID = response.id;
            });



            var attemptResponse = {};

            //If an answer already exists than update it, else post a new one to the rest api
            if(prevResponseID != undefined){
                var quizResponse = Restangular.one('QuizAttemptResponses',prevResponseID).get({"NoNested":""}).then(function(res){

                    res.answer_id = answer_id;
                    res.answer = {};
                    res.put({"NoNested":""});

                });
                //var prevResponse = Restangular.one('QuizAttemptResponses',prevResponseID).get();
               // prevResponse.remove();
            } else {
                var baseAttempts = Restangular.all("QuizAttemptResponses");
                baseAttempts.post({
                    "quiz_attempt_id":attemptID,
                    "question_id":currentQuestionID,
                    "answer_id":answer_id
                });
            }


        }
        /* * * * * * * */




        /*
        * Save quiz attempt current step
        *
        * quiz.post
        *
         */
        $scope.saveCurrentStatus = function(status,stepnumber){

            $http.get("yii/QuizAttempt/SaveProgress",{
                params: {
                    "quiz_attempt_id": $stateParams.quizAttemptId ,
                    "lastquestion": stepnumber,
                    "status":status
                }
            })


        }


        /*
        *  Save quiz attempt status
        *
        *
         */

        $scope.init = function(){

            Restangular.one('QuizAttempt',$stateParams.quizAttemptId).get().then(function(response) {
                if(response.job != undefined)
                    $scope.jobName = response.job.title;
                $scope.quiz = response;
                var answers = {};
                var responses = {};
                //Create two maps where the key is the question and the value is the response and an array of answers
                angular.forEach($scope.quiz.quizAnswers, function(answer, key){
                    if(answers[answer.question_id] != undefined)
                        answers[answer.question_id].push(answer);
                    else
                        answers[answer.question_id] = [answer];
                });
                angular.forEach($scope.quiz.quizAttemptResponses, function(response, key){
                    responses[response.question_id]=response;
                });


                //Add the answers/responses to
                angular.forEach($scope.quiz.quizQuestions, function(question, key){
                    question.answers = answers[question.id];
                    question.response = responses[question.id];
                });

                if($scope.quiz.lastquestion == undefined || $scope.quiz.lastquestion == 0){
                    $scope.quiz.lastquestion = 0;
                    $scope.currentQuestion = $scope.quiz.quizQuestions[0];
                    $scope.currentQuestion.id = $scope.quiz.quizQuestions[0].id;
                    $scope.currentIndex = 0;
                }else{
                    $scope.isPrev = true;
                    $scope.currentQuestion = $scope.quiz.quizQuestions[$scope.quiz.lastquestion-1];
                    $scope.currentQuestion.id = $scope.quiz.quizQuestions[$scope.quiz.lastquestion-1].id;
                    $scope.currentIndex = $scope.quiz.lastquestion-1;
                }





                if($scope.currentIndex >= $scope.quiz.quizQuestions.length - 1){
                    $scope.isNext = false;
                    $scope.isLastQuestion = true;
                }
            });

            if($state.current.name == 'apJobAssessment'){
                $scope.processAsApplicant();
            }

        }

        $scope.processAsApplicant = function(){
            $scope.isApplicant = true;
            $scope.showAssessmentDescription = true;
        }
        $scope.toggleShowAssDesc = function(){
            $scope.showAssessmentDescription = !$scope.showAssessmentDescription;
        }



        if($stateParams.quizAttemptId == ""){
            $state.transitionTo("dashboard");
            /*
            * Load all the questions, answers, and responses from the rest api
            * Sort and order them all so they are easy to use by Angularjs
             */
        };

        $scope.finishQuiz = function(){
            if(userFactory.isRedirect()){
                $location.path(userFactory.getRedirect());
            }else if($state.current.name == 'apJobAssessment'){
                $http.get("yii/QuizAttempt/CalculateAndSaveScores").then(function(){
                    $state.transitionTo('apAccount.default');
                });

            } else if($state.current.name == 'assessment'){
                $state.transitionTo('dashboard');
            } else {
                $state.transitionTo('dashboard');
            }
        }



        $scope.init();
        //Quiz
        //Current question
        //Question List
    }
);

/*---------------------------------------
 AP.LOGIN CONTROLLER
 ---------------------------------------*/
myApp.controller(
    'apLoginController',
    function($scope,$location, $cookieStore,Base64,Restangular,userFactory,$http){
        $scope.init = function(){
            $scope.loggedInError = undefined;
            if($cookieStore.get('applicantauthdata')){
                Restangular.setDefaultHeaders({
                    Authorization : "Basic "+ $cookieStore.get('authdata')
                });
                $location.path("/applicant-portal/account");
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
        $scope.attemptLoginApplicant = function(form){
            console.log("@");
            if (form.$valid) {

                var email = form.email;
                var password = form.password;
                userFactory.logInApplicant(true,email,password);
            }

        }


    }
);



myApp.controller(
    'apAccountController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory,$http) {

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

        $scope.user = {};
        $scope.user.first_name = userFactory.user_first_name;

        $scope.infoEditToggle = function () {
            $scope.profile.infoEdit = !$scope.profile.infoEdit;
            if (!$scope.profile.infoEdit) {
                // save info
                userFactory.saveCurrentUser();
            }
        };

        $scope.email = {'email': 'brendon.beebe@gmail.com'};
        $scope.email.emailEdit = false;
        $scope.emailEditToggle = function () {
            $scope.email.emailEdit = !$scope.email.emailEdit;
            if (!$scope.email.emailEdit) {
                $scope.newinfo.emailConfirmation = "";
                $scope.newinfo.email = "";
            } else {
                // save new email
            }
        };

        $scope.password = {};
        $scope.password.passwordEdit = false;
        $scope.passwordEditToggle = function () {
            $scope.password.passwordEdit = !$scope.password.passwordEdit;
            if (!$scope.password.passwordEdit) {
                $scope.newinfo.password = "";
                $scope.newinfo.passwordConfirmation = "";

            } else {
                // save new password
            }
        }

        $scope.saveEmail = function(){
            if($scope.newinfo.email == $scope.newinfo.emailConfirmation){
                userFactory.user.email = $scope.newinfo.emailConfirmation;
                userFactory.saveCurrentUser().success(function(data){
                    if(data.message.email!=undefined)
                        $scope.error = data.message.email[0];
                    else
                        $scope.emailEditToggle();
                    });

            } else {
                $scope.error = "Email must match";
            }
        }
        $scope.savePassword = function(){
            if($scope.newinfo.password == $scope.newinfo.passwordConfirmation){
                $http.get("yii/user/SavePassword",{
                    params: {"password":$scope.newinfo.passwordConfirmation}
                })
                $scope.passwordEditToggle();
            } else {
                $scope.error2 = "Passwords must match";
            }
        }

        $scope.init = function(){

            //Bind scope.profile to userFactory.user
            $scope.$watch( function () { return userFactory.user; }, function (data) {
                $scope.profile = data;
                $scope.newinfo = {};
            })

        }
        $scope.init();

    }
);
myApp.controller(
    'apJobApplication',
    function($scope, Restangular,$stateParams,userFactory,$location,$http,Popup,$state,applicationFactory){

        function getExistingApplication(){
            return $http({
                method: "GET",
                url: "yii/job/GetApplication",
                params: {
                    job_id: $scope.job.id
                }
            });
        }

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
        $scope.init = function(){
            $scope.application = {};
            $scope.application.skills = [];
            $scope.address={};
            if(userFactory.isApplicantLoggedIn() == false)
                $location.path('/applicant-portal/register');

            //TODO: Get only job variables that you need
            var jobPromise = Restangular.one("job",$stateParams.jobId).get();


            $scope.loadingFiles = true;
            $http.get("yii/JobApplicants/GetUploads")
                .then(
                function (response) {
                    $scope.loadingFiles = false;
                    $scope.queue = response.data.files || [];
                },
                function (response) {
                    $scope.loadingFiles = false;
                }
            );
            //After the job has loaded
            jobPromise.then(function(data){
                if(data.selectedQuestion == undefined){
                    $location.path('/applicant-portal/job/'+$stateParams.jobId);
                } else {
                    //Get current application if exists
                    $scope.job = data;
                    $scope.selectedQuestion = {};
                    $scope.questionCount = 0;
                    $scope.jobSkills = {};
                    $scope.documents = [];
                    $scope.skillCount = 0;
                    $scope.othercount = 0;
                    $scope.totalAddress = 0;
                    $scope.totalInfo = 0;

                    _.forEach($scope.job.selectedQuestion,function(response,key){

                        $scope.selectedQuestion[response.skill_id]={"required":true,"id":response.id};
                        if(response.skill_id == "address"){
                            $scope.selectedQuestion["city"]={"required":true,"id":response.id};
                            $scope.selectedQuestion["state"]={"required":true,"id":response.id};
                            $scope.selectedQuestion["zip"]={"required":true,"id":response.id};
                        }

                        $scope.questionCount++;
                        if(response.category == "documents"){
                            $scope.documents.push(response.skill_name);
                        }
                        if(response.category == "other"){
                            $scope.othercount++;
                        }
                    });

                    _.forEach($scope.job.jobSkills,function(res,key){
                        $scope.jobSkills[res.id]=res;
                        $scope.skillCount++;

                    });


                    getExistingApplication().success(function(data){


                        if(data.data != undefined){
                            //Load in all the selected skills and their responses
                            _.forEach(data.data.applicantSkillResponses,function(res,key){
                                var skill = _.findWhere($scope.jobSkills,{"id":res.skill_id});
                                if(res.response == "no"){
                                    skill.answer = "no";
                                } else {
                                    skill.answer = "yes";
                                    skill.explanation = res.response;
                                }




                            });
                        }



                        //Load in all the questions and the responses
                        _.forEach(data.data.applicantQuestionResponses,function(res,key){
                            //Address needs to be handled separately here, see notes in html
                            var question = _.findWhere($scope.selectedQuestion,{"id":res.question_id});
                            if(question == undefined)
                                return;
                            if($scope.selectedQuestion['address'] != undefined && question.id == $scope.selectedQuestion['address'].id){
                                var addressArray=res.response.split(",");
                                $scope.address.address = addressArray[0];
                                $scope.address.city = addressArray[1];
                                $scope.address.state = addressArray[2];
                                $scope.address.zip = addressArray[3];

                            }
                            if($scope.selectedQuestion['earlieststart'] != undefined && question.id == $scope.selectedQuestion['earlieststart'].id){
                                question.response = new Date(res.response);

                            } else
                                question.response = res.response;
                        });

                    });

                }
            });

        }

        $scope.apply = function(){
            if($scope.myform.$valid == false){
                console.log($scope.myform);
                console.log($scope.subform);
                $scope.submitted = true;
                return;
            }



            $scope.application.skills = $scope.job.jobSkills;
            $scope.application.questions = $scope.selectedQuestion;
            $scope.application.job_id = $scope.job.id;
            if($scope.address.address != undefined){
                $scope.application.questions.address.response = $scope.address.address+","+$scope.address.city+","+$scope.address.state+","+$scope.address.zip;
                $scope.application.questions.address.city = $scope.address.city;
                $scope.application.questions.address.zip = $scope.address.zip;
                $scope.application.questions.address.address = $scope.address.address;
                $scope.application.questions.address.state = $scope.address.state;
                if($scope.selectedQuestion['phone_home'] != undefined)
                    $scope.application.questions.address.phone =  $scope.selectedQuestion['phone_home'].response;
                if($scope.selectedQuestion['phone_cell'] != undefined)
                    $scope.application.questions.address.phone2 =  $scope.selectedQuestion['phone_cell'].response;
            }


            //For each scope.job.selectedQuestions send current answer
            //For each jobSkills send answer and explanation
            $http({
                method: "POST",
                url: "yii/job/apply",
                data: $scope.application
                //To send data in the post body use the following property
                //See documentation here: http://docs.angularjs.org/api/ng.$http#post
                //data: someobject
            })
                .success(function(data) {
                    //Forward to application screen
                    Popup.alert("Success", "Your application was successfully completed.", "Okay", "gotoApplicationsPage()", $scope, {});

                })
                .error(function(data) {
                    $scope.errormessage = data.message;
                });
        }


        $scope.gotoApplicationsPage =function(){
            applicationFactory.positionToApplyFor = undefined;
            Popup.close();
            $state.transitionTo("apAccount.applications");
        }

        $scope.init();


    }
);




myApp.controller(
    'apJobController',

    function ($scope, Restangular,$stateParams, userFactory,applicationFactory,$location) {
        //Apply for job
        $scope.apply = function(){
            applicationFactory.positionToApplyFor = $stateParams.jobCode;
            if(userFactory.isApplicantLoggedIn()){
                //If I am logged in, send me to the application
                $location.path('/applicant-portal/application/'+$stateParams.jobCode);
            } else {
                userFactory.currentApplication = $stateParams.jobCode;
                //If I am not logged in, store position in service and forward to registration
                $location.path('/applicant-portal/register');
                    //Registration should forward user to application if set
            }



        }


        //init, get job information
        $scope.init = function(){
            applicationFactory.positionToApplyFor = undefined;
            var job = Restangular.one("job",$stateParams.jobCode).get({"NoNested":true,'scenario':'public'});
            job.then(function(data){
                $scope.job = data;
                if ($scope.job.organization.logo == null) {
                    $scope.companyLogoDefault = "resources/img/default-company-img.jpg";
                } else {
                    $scope.companyLogoDefault = "files/"+$scope.job.organization.logo;

                }
                console.log($scope.job)
            })
        }
        $scope.init();

    }
);

myApp.controller(
    'apAccountResumeController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory) {

    }
);

myApp.controller(
    'apAccountApplicationsController',
    function ($scope, jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory) {

        $scope.init = function(){

        }
        $scope.init();

    }
);


myApp.controller(
    'registerController',
    function ($scope,$http,$cookieStore,$rootScope,userFactory,$timeout) {
        $scope.registerUser = function(form){
            if(form.$valid == false){
                $scope.submitted = true;
                return;
            }
            if (form.$valid) {
                $scope.error = "";
                var newUser = {};
                newUser.email = form.email.$modelValue;
                newUser.password = form.password.$modelValue;
                newUser.first_name = form.first_name.$modelValue;
                newUser.last_name = form.last_name.$modelValue;
                newUser.unique_org_id = form.org_id.$modelValue;
                newUser.org_name = form.org_name.$modelValue;
                newUser.job_title = form.job_title.$modelValue;
                newUser.phone = form.phone.$modelValue;
                newUser.reference = form.reference.$modelValue;
                newUser.size = form.org_size.$modelValue;

                //Register user
                $http.post('yii/User/RegisterOrganizationUser'
                        ,newUser).success(function (data) {
                        if(data.success == false){
                            if(data.message.email[0]!=undefined)
                                $scope.error = data.message.email[0];
                        } else {
                            //Login User
                            $timeout(function(){
                                userFactory.logIn(true,newUser.email,newUser.password,newUser.unique_org_id);
                            },250)

                        }

                    }).error(function(data){
                        $scope.error = data.error;
                    });

            }

        }
        $scope.init = function(){
            $cookieStore.remove('authdata');

        }
        $scope.init();
    }
)

myApp.controller(
    'forgotpasswordController',
    function ($scope,$http) {

        $scope.forgotPassword = function(){
            console.log($scope.forgot.email);
            $http.get("yii/User/SendForgotPasswordEmail",{
                params:{
                    "email":$scope.forgot.email.$modelValue,
                    "org_id":$scope.forgot.organization_id.$modelValue
                }
            }).success(function(){
                    $scope.message = "Step one complete! An email was sent with a link to reset your password."
                    $scope.hideForm = true;
            }).error(function(){
                    $scope.message = "There was an error sending the email";
                    $scope.hideForm = true;
                });
        }
    }
)
myApp.controller(
    'forgotpasswordemailController',
    function ($scope,$http,$stateParams,Popup,$location) {

        $scope.hash = $stateParams.hash

        $scope.init = function(){

        }
        $scope.init();
        $scope.init();



        $scope.newPassword = function(){
            $http.get("yii/User/ForgotPassword",{
                params:{
                    "hash":$scope.hash,
                    "password":$scope.newpass
                }
            }).success(function(){
                    $scope.newpass = "";
                    $scope.newpassconfirmation = "";

                    Popup.alert("Password Change", "Your password was changed correctly.", "Okay", "", $scope, {});
                    $location.path("/dashboard");
                }).error(function(data){
                    $scope.error = data.error;

            });
        }
        $scope.goHome = function(){

        }
    }
)




myApp.controller(
    'applicantsController',
    function ($scope,$http,jobFactory,Restangular,$location,$cookieStore,$rootScope,$state,userFactory) {
        $scope.order = "applicant.first_name";

        $scope.pastTier1 = false;
        $scope.$watch( function () { return jobFactory.selectedJob}, function (data) {
            if(data != undefined ){
                $scope.job = data;
                $scope.init();
            }
        });

        function calculateJobFit(applicant){
            var job_fit = $scope.job.assertive * 1 + $scope.job.responsive * 1;
            var difference = Math.abs(job_fit - (applicant.applicant.assertive * 1 + applicant.applicant.responsive * 1));
            applicant.applicant.job_fit = ((128-difference)/128*100).toFixed(2);
        }
        $scope.newTier = true;
        $scope.page = 'overview';
        $scope.pages = {
            'overview': 'overview',
            'details': 'details',
            'archive': 'archive',
            'employees': 'employees'
        }

        $scope.hireApplicant = function(id){
            $http.get("yii/JobApplicants/hire",{
                params:{
                    id:id
                }
            }).success(function(){
                    $scope.getMyApplicants();
                    $scope.job.positionsToFill -= 1;
                })
        }
        $scope.archiveApplicant = function(id){
            $http.get("yii/JobApplicants/archive",{
                params:{
                    id:id
                }
            }).success(function(){
                    $scope.getMyApplicants();
                })
        }
        $scope.deleteApplicant = function(id){
            $http.get("yii/JobApplicants/delete",{
                params:{
                    id:id
                }
            }).success(function(){
                    $scope.getMyApplicants();
                })
        }
        $scope.restoreApplicant = function(id){
            $http.get("yii/JobApplicants/restore",{
                params:{
                    id:id
                }
            }).success(function(){
                    $scope.getMyApplicants();
                })
        }
        /*
        This isn't called till the job has been loaded
         */
        $scope.getMyApplicants = function(){
            $http.get("yii/JobApplicants/GetJobApplicants",{
                params:{
                    "job_id":$scope.job.id
                }
            }).success(function(response){
                    $scope.applicants = response.data;
                });
        }
        $scope.init = function(){
            $scope.selectedStatus = "waiting";
            $scope.order = "job_fit";
            $scope.reverse = true;
            $scope.getMyApplicants();

        }

        $scope.setStatusFilter = function(newstatus){
            $scope.selectedStatus = newstatus;
        }
        $scope.setSort = function(order){
            $scope.order = order;
        }

        $scope.position = [76,61];
        $scope.john = [72,60];
        $scope.gordon = [74,59];
    }
)






myApp.controller('FileDestroyController', [
    '$scope', '$http',
    function ($scope, $http) {
        var file = $scope.file,
            state;
        if (file.url) {
            file.$state = function () {
                return state;
            };
            file.$destroy = function () {
                state = 'pending';
                return $http({
                    url: file.deleteUrl,
                    method: file.deleteType
                }).then(
                    function () {
                        state = 'resolved';
                        $scope.clear(file);
                    },
                    function () {
                        state = 'rejected';
                    }
                );
            };
        } else if (!file.$cancel && !file._index) {
            file.$cancel = function () {
                $scope.clear(file);
            };
        }
    }
]);






