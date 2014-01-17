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
                    "main_view": {
                        templateUrl: "views/lessons.html"
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
                url: "/BusinessPlan", // root route
                auth:true,
                views: {
                    "main_view": {
                        templateUrl: "views/businessplan.html",
                        controller: "BusinessPlanController"
                    }
                }
            }).state('quiz', {
                url: "/quiz", // root route
                auth:true,
                views: {
                    "main_view": {
                        templateUrl: "views/quiz.html",
                        controller: "QuizController"
                    }
                }
            }).state('profile', {
                url: "/profile", // root route
                auth:true,
                views: {
                    "main_view": {
                        templateUrl: "views/profile.html",
                        controller: "ProfileController"
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




