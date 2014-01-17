'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers','blueimp.fileupload','ui.state','ui.slider','ui.date','ui.keypress','restangular','angularTreeview']).
  config(function($stateProvider, $routeProvider,RestangularProvider,$urlRouterProvider,$locationProvider){



        $urlRouterProvider.otherwise('/404');
        $stateProvider.state('catchall', {
            url: "/404", // root route
            views: {
                    "main_view": {
                        templateUrl: "views/catchall.html"
                    }
                }
            })

            .state('lessons', {
                url: "/lessons", // root route
                auth:true,
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/lessons.html",
                        controller: "LessonsController"
                    }
                }
            }).state('lessons.first', {
                url: "/first", // root route
                auth:true,
                views: {
                    "lesson_view": {
                        templateUrl: "views/lessons/first.html",
                        controller: "LessonsController"
                    }
                }
            }).state('lessons.second', {
                url: "/second", // root route
                auth:true,
                views: {
                    "lesson_view": {
                        templateUrl: "views/lessons/second.html",
                        controller: "LessonsController"
                    }
                }
            }).state('lessons.third', {
                url: "/third", // root route
                auth:true,
                views: {

                    "lesson_view": {
                        templateUrl: "views/lessons/third.html",
                        controller: "LessonsController"
                    }
                }
            }).state('main', {
                url: "", // root route
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/home.html"
                    }
                }
            }).state('index', {
                url: "/", // root route
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/home.html"
                    }
                }
            }).state('login', {
                url: "/login", // root route
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/login.html",
                        controller: "LoginController"
                    }
                }
            }).state('businessplan', {
                url: "/businessplan", // root route
                auth:true,
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/businessplan.html",
                        controller: "BusinessPlanController"
                    }
                }
            }).state('quiz', {
                url: "/quiz", // root route
                auth:true,
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/lessons.html",
                        controller: "LessonsController"
                    }
                }
            }).state('quiz.second', {
                url: "/second", // root route
                auth:true,
                views: {
                    "lesson_view": {
                        templateUrl: "views/quiz/quiz2.html",
                        controller: "QuizController"
                    }
                }
            }).state('quiz.third', {
                url: "/third", // root route
                auth:true,
                views: {
                    "lesson_view": {
                        templateUrl: "views/quiz/quiz3.html",
                        controller: "QuizController"
                    }
                }
            }).state('quiz.first', {
                url: "/first", // root route
                auth:true,
                views: {
                    "lesson_view": {
                        templateUrl: "views/quiz/quiz1.html",
                        controller: "QuizController"
                    }
                }
            }).state('profile', {
                url: "/profile", // root route
                auth:true,
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/profile.html",
                        controller: "ProfileController"
                    }
                }
            }).state('register', {
                url: "/register", // root route
                views: {
                    "header_view":{
                        templateUrl: "views/header.html"
                    },
                    "main_view": {
                        templateUrl: "views/register.html",
                        controller: "RegisterController"
                    }
                }
            })
    }).run(function($rootScope,Restangular,userFactory,$state,$location,$cookieStore,$window){


        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
            //If page requires logged in user and user is not logged in, redirect to login

            if (toState.auth && !userFactory.isLoggedIn()) {
                userFactory.logIn(false);
            }
        });

});




