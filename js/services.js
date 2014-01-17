'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

myApp.factory('applicationFactory',function(){
    var factory = {}


    return factory;
});

myApp.factory('userFactory',function(Base64,$http,$cookieStore,$state,Restangular,$location,$rootScope){
    var factory = {};
    var loggedIn = false;
    var applicantLoggedIn = false;
    var redirectTo;

    factory.user = {
    }

    factory.setRedirect = function(to){
        redirectTo = to;
    }
    factory.isRedirect = function(){
        return (redirectTo != undefined);
    }
    factory.getRedirect = function(){
        var toReturn = redirectTo;
        redirectTo = undefined;
        return toReturn;
    }

    factory.saveCurrentUser =function(){
        return $http.post('yii/user/SaveUserInfo'
                ,factory.user).success(function (data) {
            });
    }
    factory.isLoggedIn = function(){
        return loggedIn;
    }

    factory.logOut = function(){
        $cookieStore.remove('authdata');
        $http.get("yii/user/logout");
        loggedIn = false;

    };

    factory.logIn = function(redirect,username,password){

        if(username != undefined && password != undefined){
            var encoded = Base64.encode(username+":"+password);
            $cookieStore.put("authdata",encoded);
            $http.defaults.headers.common["Authorization"] = "Basic "+ $cookieStore.get('authdata');
        } else if($cookieStore.get("authdata")!= undefined){
            encoded = $cookieStore.get("authdata");
            $http.defaults.headers.common["Authorization"] = "Basic "+ encoded;
        } else{
            $location.path('/login');
            return;
        }

            if(redirect){

                $http.get("yii/user/logout").then(function(){
                    factory.getUserInfo(redirect)
                })

            } else {
                factory.getUserInfo();
            }



        loggedIn = true;
    }

    factory.getUserInfo = function(redirect){
        $http({
            url: "yii/user/userinfo",
            method: "GET",
            params: {
                organization_id:factory.organization_id
            }
        }).
            success(function(data, status, headers, config) {
                factory.loggedInError = undefined;

                if(data.success == true){
                    factory.user = data.data.data;



                    if(redirect == true){
                        $state.transitionTo('lessons');
                    }



                    loggedIn = true;


                } else {
                    factory.loggedInError = data.message;

                }

            }).error(function(data, status, headers, config) {
                $cookieStore.remove('authdata');
                factory.loggedInError = "Email or Password is incorrect."
            });
    }

    factory.getUserId = function(){
        return factory.user.id;
    }
    factory.isPARequired = function(){
        return factory.user.assessment_required;
    }

    //factory.logIn();
    return factory;
});



myApp.factory('Base64', function() {
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };
});


myApp.factory('Popup', function ($http, $compile) {
    // Got the idea for this from a post I found. Tried to not have to make this
    // object but couldn't think of a way to get around this
    var popupService = {};

    // Get the popup
    popupService.getPopup = function(create)
    {
        if (!popupService.popupElement && create)
        {
            popupService.popupElement = $('<div class="modal lightbox fade hide"></div>' );
            popupService.popupElement.appendTo('body');
        }

        return popupService.popupElement;
    }

    popupService.compileAndRunPopup = function (popup, scope, options) {
        $compile(popup)(scope);
        $.colorbox({
            html:popup,
            width:"500px",
            transition: "fade",
            overlayClose: true,
            speed: 0,
            scrolling: false,
            opacity:.5,
            height: 300,
            className: "colormebox"

        });
        //popup.modal(options);
    }

    // Is it ok to have the html here? should all this go in the directives? Is there another way
    // get the html out of here?
    popupService.alert = function(title, text, buttonText, alertFunction, scope, options) {
        text = (text) ? text : "Alert";
        buttonText = (buttonText) ? buttonText : "Ok";
        var alertHTML = "";
        if (title) {
            alertHTML += '<div class="modal-header"><h2>' + title + '</h2></div>';
        }

        alertHTML += '<div class="modal-body">' + text + '</div>'
            + '<div class="controls">';

        if (alertFunction) {
            alertHTML += '<button class="btn pull-right" ng-click="' + alertFunction + '">' + buttonText + '</button>';
        }	else {
            alertHTML += '<button class="btn pull-right">'+buttonText+'</button>';
        }

        alertHTML += '</div>';
        var popup = popupService.getPopup(true);
        popup.html(alertHTML);
        if (!alertFunction)
        {
            popup.find(".btn").click(function () {
                popupService.close();
            });
        }

        popupService.compileAndRunPopup(popup, scope, options);
    }

    // Is it ok to have the html here? should all this go in the directives? Is there another way
    // get the html out of here?
    popupService.confirm = function(title, actionText, actionButtonText, actionFunction, cancelButtonText, cancelFunction, scope, options) {
        actionButtonText = (actionButtonText) ? actionButtonText : "Ok";
        cancelButtonText = (cancelButtonText) ? cancelButtonText : "Cancel";

        var popup = popupService.getPopup(true);
        var confirmHTML = "";
        if (title)
            confirmHTML += '<div class="modal-header"><h2>' + title + '</h2></div>';

        if (actionText)
            confirmHTML += '<div class="modal-body">' + actionText + '</div>';

        confirmHTML += '<div class="controls">';

        if (actionFunction) {
            confirmHTML += '<button class="btn btn-primary pull-right" ng-click="' + actionFunction + '">' + actionButtonText + '</button>';
        } else {
            confirmHTML += '<button class="btn btn-primary pull-right">' + actionButtonText + '</button>';
        }

        if (cancelFunction) {
            confirmHTML += '<button class="btn btn-cancel pull-right" ng-click="'+cancelFunction+'">' + cancelButtonText + '</button>';
        } else {
            confirmHTML += '<button class="btn btn-cancel pull-right">' + cancelButtonText + '</button>';
        }

        confirmHTML += '</div>';
        popup.html(confirmHTML);
        //if (!actionFunction) {
            popup.find(".btn-primary").click(function () {
                popupService.close();
            });
        //}

        if (!cancelFunction) {
            popup.find(".btn-cancel").click(function () {
                popupService.close();
            });
        }
        popupService.compileAndRunPopup(popup, scope, options);
    }

    // Loads the popup
    popupService.load = function(url, scope, options) {
        $http.get(url).success(function (data) {
            var popup = popupService.getPopup(true);

            popup.html(data);
            popupService.compileAndRunPopup(popup, scope, options);

            popup.find(".btn-cancel").click(function () {
                popupService.close();
            });
        });
    }

    popupService.close = function() {
        var popup = popupService.getPopup()
        if (popup)
            $.colorbox.close();
    }

    return popupService;
});

