﻿(function () {
    /**
     * @param $ionicSlideBoxDelegate
     */
    function Directive($ionicSlideBoxDelegate) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                scope.$watch(attrs.slidesRefresh, function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        $ionicSlideBoxDelegate.update();
                    }
                });
            }
        };
    };

    app.directive("slidesRefresh", ["$ionicSlideBoxDelegate", Directive]);
})();
