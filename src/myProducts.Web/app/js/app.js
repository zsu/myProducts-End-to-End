﻿var app = angular.module("myApp", ["ngRoute", "ngTouch", "ngAnimate", "$strap.directives", "ui.bootstrap", "kendo.directives", "tt.SignalR", "tt.Authentication", "ngCookies", "pascalprecht.translate", "routeResolverServices", "ng-scrollable", "angular-carousel", "frapontillo.bootstrap-switch", "ngStorage", "imageupload", "ngGrid", "nvd3ChartDirectives"]);

app.config(["$routeProvider", "$locationProvider", "$translateProvider", "$httpProvider", "routeResolverProvider", "$controllerProvider", "$compileProvider", "$filterProvider", "$provide",
    function ($routeProvider, $locationProvider, $translateProvider, $httpProvider, routeResolverProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

        ttTools.initLogger(ttTools.baseUrl + "api/log");
        ttTools.logger.info("Configuring myApp...");

        app.register =
        {
            controller: $controllerProvider.register,
            directive: $compileProvider.directive,
            filter: $filterProvider.register,
            factory: $provide.factory,
            service: $provide.service
        };

        routeResolverProvider.routeConfig.setBaseDirectories("app/views/", "app/js/controllers/");

        $routeProvider
            .when("/info", { templateUrl: "app/views/info.html", controller: "InfoController" })
            .when("/settings", { templateUrl: "app/views/settings.html", controller: "SettingsController" })
            .when("/login", { templateUrl: "app/views/login.html", controller: "LoginController" });

        $provide.factory('$routeProviderService', function () {
            return $routeProvider;
        });
        $provide.factory('routeResolverProviderService', function () {
            return routeResolverProvider;
        });

        $translateProvider.translations("de", tt.translations.de);
        $translateProvider.useStaticFilesLoader({
            prefix: "app/translations/locale-",
            suffix: ".json"
        });
        $translateProvider.preferredLanguage("de");
        $translateProvider.useLocalStorage();

        $httpProvider.responseInterceptors.push("loadingIndicatorInterceptor");
        var transformRequest = function (data) {
            theSpinner.spin(getSpinner());

            return data;
        };
        $httpProvider.defaults.transformRequest.push(transformRequest);
    }]);

app.run(["$http", "$templateCache", "$rootScope", "$location", "$translate", "toast", "dialog", "$route", "$routeProviderService", "routeResolverProviderService",
    function ($http, $templateCache, $rootScope, $location, $translate, toast, dialog, $route, $routeProviderService, routeResolverProviderService) {

        window.addEventListener("online", function () {
            $rootScope.$apply($rootScope.$broadcast(tt.networkstatus.onlineChanged, true));
        }, true);
        window.addEventListener("offline", function () {
            $rootScope.$apply($rootScope.$broadcast(tt.networkstatus.onlineChanged, false));
        }, true);

        var viewsDir = routeResolverProviderService.routeConfig.getViewsDirectory();
        $http.get(viewsDir + "info.html", { cache: $templateCache });

        $rootScope.$on(tt.authentication.loggedIn, function () {
            $http({ method: "GET", url: ttTools.baseUrl + "api/personalization" })
            .success(function (data) {
                theSpinner.spin(getSpinner());

                tt.personalization.data = data;
                var route = routeResolverProviderService.route;

                angular.forEach(data.Features, function (value, key) {
                    $routeProviderService.when(value.Url, route.resolve(value.Module));
                });

                $rootScope.$broadcast(tt.personalization.dataLoaded);
                $route.reload();

                theSpinner.stop();
            });
        });

        // TODO: what about unloading!?

        window.applicationCache.addEventListener('updateready', function (ev) {
            if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                console.log('CACHE: Browser downloaded a new app cache manifest.');
                window.applicationCache.swapCache();

                $rootScope.$apply(dialog.showModalDialog({}, {
                    headerText: 'App Update',
                    bodyText: $translate("APP_UPDATE_BODY"),
                    closeButtonText: $translate("COMMON_NO"),
                    actionButtonText: $translate("COMMON_YES"),
                    callback: function () {
                        window.location.reload();
                        console.log('CACHE: App will be updated...');
                    }
                }));
            } else {
                console.log('CACHE: Manifest didn\'t change.');
            }
        }, false);

        var oldOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
            if (url.indexOf("/signalr") === -1) {
                this.addEventListener("readystatechange", function () {
                    if (this.readyState === 1) {
                        theSpinner.spin(getSpinner());
                    }
                    ;
                    if (this.readyState === 4) {
                        theSpinner.stop();
                    }
                    ;
                }, false);
            }

            oldOpen.call(this, method, url, async, user, pass);
        };

        $rootScope.$on("$locationChangeStart", function () {
            if (!$rootScope.tt.authentication.userLoggedIn) {
                $rootScope.$broadcast(tt.authentication.authenticationRequired);
            }
        });

        $rootScope.$on(tt.authentication.authenticationRequired, function () {
            $location.path("/login");
        });
        $rootScope.$on(tt.authentication.loginConfirmed, function () {
            $location.path("/");

            toast.pop({
                title: "Login",
                body: $translate("LOGIN_SUCCESS"),
                type: "success"
            });
        });
        $rootScope.$on(tt.authentication.loginFailed, function () {
            $location.path("/login");
            toast.pop({
                title: "Login",
                body: $translate("LOGIN_FAILED"),
                type: "error"
            });
        });
        $rootScope.$on(tt.authentication.logoutConfirmed, function () {
            $location.path("/login");
        });
    }]);

app.factory("loadingIndicatorInterceptor", function ($q) {
    return function (promise) {
        return promise.then(
            function (response) {
                theSpinner.stop();

                return response;
            },
            function (response) {
                theSpinner.stop();

                return $q.reject(response);
            });
    };
});

var theSpinner = new Spinner({
    lines: 12,
    length: 20,
    width: 2,
    radius: 10,
    color: '#000',
    speed: 1,
    trail: 100,
    shadow: true,
    top: "auto",
    left: "auto"
});

function getSpinner() {
    var sp = document.getElementById("spinner");
    return sp;
}