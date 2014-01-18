'use strict';

/* Directives */


var module = angular.module('myApp.directives', []).
    directive('appVersion', ['version', function(version) {

        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]).
    directive('currentlink', ['$location', function(location) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs, controller) {

                var clazz = attrs.currentlink;
                var path = "";
                attrs.$observe('href',function(value){

                    if(value == undefined)
                        return;

                    path = value;
                    path = path.substring(1); //hack because path does bot return including hashbang
                    if(location.path() == path)
                        element.addClass(clazz);
                });

                scope.location = location;

                scope.$watch('location.path()', function(newPath) {
                    if (path === newPath) {
                        element.addClass(clazz);
                    } else {
                        element.removeClass(clazz);
                    }
                });
            }

        };

    }])
    .directive('togglesetting', function () {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.on('mousedown', function () {
                    var parent = element.parent();
                    if (parent.hasClass('on') && element.hasClass('off') ||
                        parent.hasClass('off') && element.hasClass('on')) {
                        element.parent().toggleClass('off on');
                        scope.$apply(attrs.togglesetting);
                    }
                });
            }
        }
    })

    .directive('windowsize', function() {
        return function(scope, element, attrs) {

            var viewport = $(window);
            var header = $('div[ui-view="header_view"]');
            var child = element.children('.wrapper-child');
            var today = new Date();
            var yr = today.getUTCFullYear();


            element.height(viewport.height() - header.height() - attrs.windowsize);
            child.css('min-height', element.height() - 120);
            viewport.resize(function () {
                element.height(viewport.height() - header.height() - attrs.windowsize);
                child.css('min-height', element.height() - 120);
            });

            if (attrs.windowsize == '') {
                element.append('' +
                    '<div class="copyright">' +
                    '<img src="resources/img/persogenics-logo-large.png">' +
                    '<div>© ' + yr + ' | Made with <span style="color:#FA3257">?</span> in Provo, UT</div>' +
                    '</div>')
            }
        }
    })




    .directive('togglesearch', function($parse) {
        return function(scope, element, attrs) {
            var search_btn = element.find('.search');
            var input = element.find('input');
            var search_collapse = element.find('.search-collapse');
            var close = element.find('.close');

            search_btn.on('click', function() {
                search_collapse.toggleClass('open');
                setTimeout(function(){
                    input.focus();
                },500);
            });
            scope.$on('event:cancelSearch',function(){
                search_collapse.toggleClass('open',false);
                var getter = $parse(attrs.ngModel);
                var setter = getter.assign;
                //Set dropdown ngmodel=id # we use id here and not text
                scope.$apply(function(){
                    setter(scope,"");
                })
            })

            close.on('click', function() {
                var getter = $parse(attrs.ngModel);
                var setter = getter.assign;
                //Set dropdown ngmodel=id # we use id here and not text
                scope.$apply(function(){
                    setter(scope,"");
                })

                search_collapse.toggleClass('open');
            });
        }
    })
    // attrs:
    // all -> checkbox that checks/unchecks all checkboxes on the page
    // self -> checkbox that checks/unchecks itself (should require another attribute rowmodel, this should equal the model of an individual row)
    .directive('rowselect', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {

                if (attrs.rowselect == 'all') {
                    scope.allSelected = false;
                    element.on('click',function(){
                        scope.$apply(function(){
                            scope.allSelected = ! scope.allSelected;
                            scope.$broadcast("event:selectrow",scope.allSelected);
                        })

                    });

                }

                if (attrs.rowselect == 'self') {
                    var rowObject;

                    //Use $observe when the attributes model may change
                    attrs.$observe("rowmodel", function (val) {
                        if(val!=undefined){
                            //Use $eval to parse a string as javascript,
                            //in this example val could be the string "user"
                            //$eval would convert user into the object it was supposed to be
                            rowObject = scope.$eval(val);

                        }
                    });
                    element.on('click', function(event) {
                        //If checkbox is not in this statement, it will check/uncheck its self in a circle
                        if(rowObject!=undefined && event.target.type != "checkbox"){
                            //If an element has this attribute it means it shouldn't effect the selected row
                            if(event.target.getAttribute("allowclick") == undefined){
                                //Using $apply will update the view after a change in a model
                                scope.$apply(function(){
                                    //The checkbox is bound to this value
                                    //true = selected
                                    //false = not selected
                                    rowObject.selected = !rowObject.selected;
                                })
                            }

                        }
                    });
                    scope.$on("event:selectrow",function(event,data){
                        if(rowObject != undefined)
                            rowObject.selected = data;
                    })
                }

            }
        }



    })

    /*
     * This directive is used to model the question in the personal assessment
     * This assessment/quiz is modeled in the following way
     *
     * Select an 'answer' that is most like yourself and least like yourself.
     * There are 2 columns, one for least and one for most
     * Each row must have something selected and it can't be the same answer in each column
     */
    .directive('pachoose', function($timeout) {
        return {
            restrict: "A",
            scope:{
                "question":"=pachoose"
            },
            link: function(scope, element, attrs) {
                scope.selectLeast = function(answerid){
                    if(scope.question.response.most == answerid)
                        scope.question.response.most = undefined;
                    scope.question.response.least = answerid;
                }
                scope.selectMost= function(answerid){
                    if(scope.question.response.least == answerid)
                        scope.question.response.least = undefined;
                    scope.question.response.most = answerid;
                }
                /*
                question.answers
                question.response.least = answer.id
                question.response.most  = answer.id

                 */
            }
        }
    })

    .directive('d3row', function() {
        return {
            restrict: "E",
            scope: {
                data: "=set",
                assertive: "=assertive",
                responsive: "=responsive"
            },
            link: function(scope, element) {
                // set graph variables
                var svgWidth = 300;
                var svgHeight = 40;
                var svgPadding = 8;

                var color = d3.scale.ordinal()
                    .range(['#45b2de', '#76e0ff']);

                var svg = d3.select(element[0])
                    .append('svg')
                    .attr('width', svgWidth)
                    .attr('height', svgHeight);

                svg.selectAll('rect')
                    .data([scope.responsive,scope.assertive])
                    .enter()
                    .append('rect')
                    .attr('x', function(d, i) {
                        return (svgWidth - (d * 2.73))
                    })
                    .attr('y', function(d, i) {
                        return (i * 14) + svgPadding;
                    })
                    .attr('width', function(d, i) {
                        return (d * 2.73);
                    })
                    .attr('height', 10)
                    .attr('fill', function(d, i) { return color(i); });

                svg.selectAll('text.number')
                    .data([scope.responsive,scope.assertive])
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", "end")
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#808080',
                        'font-weight':400,
                        'font-size':'11px',
                        'font-style': 'italic'
                    })
                    .attr('x', 20)
                    .attr('y', function(d, i) {
                        return (i * 14) + 8 + svgPadding;
                    });
                var linedata = [
                    (0 * 2.73) + 28,
                    (25 * 2.73) + 28,
                    (50 * 2.73) + 27,
                    (75 * 2.73) + 26,
                    (100 * 2.73) + 26
                ]
                svg.selectAll('line.one')
                    .data(linedata)
                    .enter()
                    .append("line")
                    .attr("x1", function(d,i) {
                        return d;
                    })
                    .attr("y1", 0)
                    .attr("x2", function(d,i) {
                        return d;
                    })
                    .attr("y2", 50)
                    .style({
                        'stroke-dasharray': ("3, 3"),
                        'stroke': '#dedede'
                    })
                    .attr("stroke-width", 2)
                    .attr("stroke", "black");
            }
        }
    })

    .directive('d3head', function($timeout) {
        return {
            restrict: "E",
            scope: {
                assertive: "=assertive",
                responsive: "=responsive"
            },
            link: function(scope, element) {
                $timeout(function(){
                    // set graph variables
                    var svgWidth = 400;
                    var svgPadding = 13;
                    var svgHeight = 50;
                    var multiplier = 2.73;

                    var svg = d3.select(element[0])
                        .append('svg')
                        .attr('width', svgWidth)
                        .attr('height', svgHeight);

                    var color = d3.scale.ordinal()
                        .range(['#45b2de', '#76e0ff']);

                    svg.selectAll('rect')
                        .data([scope.assertive,scope.responsive])
                        .enter()
                        .append('rect')
                        .attr('x', function(d, i) {
                            return (svgWidth - (d * multiplier))
                        })
                        .attr('y', function(d, i) {
                            return (i * 14) + svgPadding;
                        })
                        .attr('width', function(d, i) {
                            return (d * multiplier);
                        })
                        .attr('height', 10)
                        .attr('fill', function(d, i) { return color(i); });

                    var dataInclude = ['Assertiveness ' + scope.assertive, 'Responsiveness ' + scope.responsive]
                    svg.selectAll('text.number')
                        .data(dataInclude)
                        .enter()
                        .append('text')
                        .attr("class", "number")
                        .attr("text-anchor", "end")
                        .text(function(d) {
                            return d;
                        })
                        .style({
                            'fill': '#808080',
                            'font-weight':400,
                            'font-size':'11px',
                            'font-style': 'italic'
                        })
                        .attr('x', 120)
                        .attr('y', function(d, i) {
                            return (i * 14) + 8 + svgPadding;
                        });

                    var linedata = [
                        (0 * multiplier) + 128,
                        (25 * multiplier) + 128,
                        (50 * multiplier) + 127,
                        (75 * multiplier) + 126,
                        (100 * multiplier) + 126
                    ]
                    svg.selectAll('line.one')
                        .data(linedata)
                        .enter()
                        .append("line")
                        .attr("x1", function(d,i) {
                            return d;
                        })
                        .attr("y1", 0)
                        .attr("x2", function(d,i) {
                            return d;
                        })
                        .attr("y2", 50)
                        .style({
                            'stroke-dasharray': ("3, 3"),
                            'stroke': '#d1d1d1'
                        })
                        .attr("stroke-width", 2)
                        .attr("stroke", "black");

                },1000);



            }
        }
    })
    .directive('d3pie', function($rootScope,$timeout) {
        return {
            restrict: "E",
            scope: {
                data: "=set",
                total: "=total"
            },
            link: function(scope, element, attrs) {
                $rootScope.$on('event:reloadGraph', function(event, toState, toParams, fromState, fromParams){
                    //If page requires logged in user and user is not logged in, redirect to login


                    $timeout(function(){ console.log(scope.data,"DATA");
// percentage will throw NAN if total == 0
                        if (scope.total == 0) {
                            var percentage = 0;
                        } else {
                            var applicants = scope.data;
                            var total = scope.total;

                            var divisor = applicants * 100;
                            var percentage = divisor / total;
                        }

                        var data = [percentage, 100 - percentage]
                        var width = 140;
                        var height = 140;
                        var radius = Math.min(width, height) / 2;

                        if (attrs.tier == '3') {
                            var color = d3.scale.ordinal()
                                .range(['rgba(179,114,221,1)', 'rgba(255,255,255,.2)']);
                            var rgba = 'rgba(179,114,221,1)';
                        }


                        if (attrs.tier == '2') {
                            var color = d3.scale.ordinal()
                                .range(['rgba(255,153,0,1)', 'rgba(255,255,255,.2)']);
                            var rgba = 'rgba(255,153,0,1)';
                        }

                        if (attrs.tier == '1') {
                            var color = d3.scale.ordinal()
                                .range(['rgba(92,184,92,1)', 'rgba(255,255,255,.2)']);
                            var rgba = 'rgba(92,184,92,1)';
                        }

                        var pie = d3.layout.pie()
                            .sort(null);

                        var arc = d3.svg.arc()
                            .innerRadius(radius - 10)
                            .outerRadius(radius);
                        element.children(":first").remove();
                        var canvas = d3.select(element[0]).append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append("g")
                            .attr("transform", "translate(70, 70)");

                        var path = canvas.selectAll("path")
                            .data(pie(data))
                            .enter()
                            .append("path")
                            .attr("fill", function(d, i) { return color(i); })
                            .attr("d", arc);

                        element.parent().append('' +
                            '<div class="percentage">'+ Math.round(percentage) +
                            '<small>%</small></div>' +
                            '<div class="top">TIER '+ attrs.tier +'</div>' +
                            '<div class="bottom"><span style="color: ' + rgba + '; font-weight:700;">TIER ' + attrs.tier + '</span> APPLICANTS</div>');
                    },100);
                });


            }
        }
    })
    .directive('focustooltip', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs) {
                var tooltip = element.siblings('.org-id-tooltip');
                element.on('focusin', function() {
                    tooltip.css('display', 'block');
                });
                element.on('focusout', function() {
                    tooltip.css('display', 'none');
                });
            }
        }
    })

    .directive('d3results', function($timeout,$rootScope) {
        return {
            restrict: "E",
            scope: {
                data: "=set",
                assertive: "=assertive",
                responsive: "=responsive"
            },
            link: function(scope, element) {

                $rootScope.$on('event:reloadGraph', function(event, toState, toParams, fromState, fromParams){
                    //If page requires logged in user and user is not logged in, redirect to login


                    $timeout(function(){
// set graph variables
                        var svgWidth = '100%';
                        var svgHeight = 120;
                        var svgPadding = 44;
                        var barHeight = 40;
                        var paddingTop = 20;
                        var color = d3.scale.ordinal()
                            .range(['#45b2de', '#76e0ff']);

                        element.children(":first").remove();
                        var svg = d3.select(element[0])
                            .append('svg')
                            .attr('width', svgWidth)
                            .attr('height', svgHeight);

                        svg.selectAll('rect.grey')
                            .data([100,100])
                            .enter()
                            .append('rect')
                            .attr()
                            .attr('x', function(d, i) {
                                return 0;
                            })
                            .attr('y', function(d, i) {
                                return (i * svgPadding) + paddingTop;
                            })
                            .attr('width', function(d, i) {
                                return (d + '%');
                            })
                            .attr('height', barHeight)
                            .attr('fill', '#f3f3f3');

                        svg.selectAll('rect.graph')
                            .data([scope.assertive,scope.responsive])
                            .enter()
                            .append('rect')
                            .attr('x', function(d, i) {
                                return 0;
                            })
                            .attr('y', function(d, i) {
                                return (i * svgPadding) + paddingTop;
                            })
                            .attr('width', function(d, i) {
                                return (d + '%');
                            })
                            .attr('height', barHeight)
                            .attr('fill', function(d, i) { return color(i); });

                        var legend = ['Assertiveness', 'Responsiveness']
                        svg.selectAll('rect.legend')
                            .data(legend)
                            .enter()
                            .append('rect')
                            .attr('x', function(d, i) {
                                return i * 140;
                            })
                            .attr('y', 0)
                            .attr('width', 12)
                            .attr('height', 12)
                            .attr('fill', function(d, i) { return color(i); });

                        svg.selectAll('text.legend')
                            .data(legend)
                            .enter()
                            .append('text')
                            .attr('text-anchor', 'start')
                            .text(function (d) {
                                return d;
                            })
                            .style({
                                'font-weight':700,
                                'fill':'#808080'
                            })
                            .attr('x', function(d, i) {
                                return (i * 140) + 18;
                            })
                            .attr('y', 11);

                        svg.selectAll('text.number')
                            .data([scope.assertive,scope.responsive])
                            .enter()
                            .append('text')
                            .attr("class", "number")
                            .attr("text-anchor", "end")
                            .text(function(d) {
                                return d;
                            })
                            .style({
                                'fill': '#fff',
                                'font-weight':700,
                                'font-size':'16px'
                            })
                            .attr('x', function (d, i) {
                                return d - 1.8 + '%';
                            })
                            .attr('y', function(d, i) {
                                return (i * svgPadding) + 46;
                            });



                        var scaleData = [0,25,50,75,100];
                        svg.selectAll('text.scale')
                            .data(scaleData)
                            .enter()
                            .append('text')
                            .attr("class", "number")
                            .attr("text-anchor", function(d, i) {
                                if (d == 0) {
                                    return 'start';
                                } else if (d == 100) {
                                    return 'end';
                                } else {
                                    return 'middle';
                                }
                            })
                            .text(function(d) {
                                return d;
                            })
                            .style({
                                'fill': '#000',
                                'font-weight':400,
                                'font-size':'11px'
                            })
                            .attr('x', function(d, i) {
                                return d + '%';
                            })
                            .attr('y', paddingTop + 99);

                        var lineData = [0, 25,50,75,100]
                        svg.selectAll('line.one')
                            .data(lineData)
                            .enter()
                            .append("line")
                            .attr("x1", function(d,i) {
                                return d + '%';
                            })
                            .attr("y1", paddingTop)
                            .attr("x2", function(d,i) {
                                return d + '%';
                            })
                            .attr("y2", paddingTop + 40)
                            .style({
                                'stroke-dasharray': ("3, 3"),
                                'stroke': 'rgba(0,0,0,.1)'
                            })
                            .attr("stroke-width", 1);

                        svg.selectAll('line.two')
                            .data(lineData)
                            .enter()
                            .append("line")
                            .attr("x1", function(d,i) {
                                return d + '%';
                            })
                            .attr("y1", paddingTop + 44)
                            .attr("x2", function(d,i) {
                                return d + '%';
                            })
                            .attr("y2", paddingTop + 84)
                            .style({
                                'stroke-dasharray': ("3, 3"),
                                'stroke': 'rgba(0,0,0,.1)'
                            })
                            .attr("stroke-width", 1);
                    },1000);

                });
                $rootScope.$broadcast("event:reloadGraph");
            }
        }
   })
    .directive('d3personalreport', function() {
        return {
            restrict: "E",
            scope: {
                data: "=set"
            },
            link: function(scope, element) {

                var svgWidth = 550;
                var svgHeight = 200;
                var svgHeightVariable = svgHeight / 1000;
                var barPadding = 8;
                var barWidth = 32;
                var paddingTop = 20;
                var paddingBottom = 60;
                var paddingLeft = 40;
                function patternDivision(num) {
                    return ((barWidth * 3) + (barPadding * 4)) * num;
                }
                var colorSelf = d3.scale.ordinal()
                    .range(['#45b2de', '#7bc8e7', '#b3dff1']);

                var ranges = [
                    1000, 900, 800, 700, 600, 500,
                    400, 300, 200, 100, 0
                ];

                var dom = [
                    100, // self
                    200, // others
                    300  // work
                ]

                var exp = [
                    400, // self
                    500, // others
                    600  // work
                ]

                var ana = [
                    700, // self
                    800, // others
                    900  // work
                ]

                var ama = [
                    933, // self
                    966, // others
                    1000  // work
                ]

                var svg = d3.select(element[0])
                    .append('svg')
                    .attr('width', svgWidth)
                    .attr('height', svgHeight + paddingTop + paddingBottom);


                svg.selectAll('rect.neutral')
                    .data(' ')
                    .enter()
                    .append('rect')
                    .attr('y', svgHeight + paddingTop - (600 * svgHeightVariable))
                    .attr('x', 0)
                    .attr('height', svgHeightVariable * 200)
                    .attr('width', svgWidth)
                    .attr('fill', '#f3f3f3');

                svg.selectAll('line.one')
                    .data(ranges)
                    .enter()
                    .append("line")
                    .attr("x1", function(d,i) {
                        return 35;
                    })
                    .attr('y1', function(d, i) {
                        return (i * (svgHeight / 10)) + paddingTop;
                    })
                    .attr("x2", svgWidth)
                    .attr("y2", function(d, i) {
                        return (i * (svgHeight / 10)) + paddingTop;
                    })
                    .style({
                        'stroke-dasharray': ("3, 3"),
                        'stroke': 'rgba(0,0,0,.1)'
                    })
                    .attr("stroke-width", 1);

                svg.selectAll('rect.dom')
                    .data(dom)
                    .enter()
                    .append('rect')
                    .attr()
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable);
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft;
                    })
                    .attr('height', function(d, i) {
                        return d * svgHeightVariable;
                    })
                    .attr('width', barWidth)
                    .attr('fill', function(d, i) {
                        return colorSelf(i);
                    });

                svg.selectAll('rect.exp')
                    .data(exp)
                    .enter()
                    .append('rect')
                    .attr()
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable);
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(1);
                    })
                    .attr('height', function(d, i) {
                        return d * svgHeightVariable;
                    })
                    .attr('width', barWidth)
                    .attr('fill', function(d, i) {
                        return colorSelf(i);
                    });

                svg.selectAll('rect.ana')
                    .data(ana)
                    .enter()
                    .append('rect')
                    .attr()
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable);
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(2);
                    })
                    .attr('height', function(d, i) {
                        return d * svgHeightVariable;
                    })
                    .attr('width', barWidth)
                    .attr('fill', function(d, i) {
                        return colorSelf(i);
                    });

                svg.selectAll('rect.ama')
                    .data(ama)
                    .enter()
                    .append('rect')
                    .attr()
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable);
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(3);
                    })
                    .attr('height', function(d, i) {
                        return d * svgHeightVariable;
                    })
                    .attr('width', barWidth)
                    .attr('fill', function(d, i) {
                        return colorSelf(i);
                    });


                /*
                svg.selectAll('rect.legend')
                    .data(legend)
                    .enter()
                    .append('rect')
                    .attr('x', function(d, i) {
                        return i * 140;
                    })
                    .attr('y', 0)
                    .attr('width', 12)
                    .attr('height', 12)
                    .attr('fill', function(d, i) { return color(i); });
                svg.selectAll('text.legend')
                    .data(legend)
                    .enter()
                    .append('text')
                    .attr('text-anchor', 'end')
                    .text(function (d) {
                        return d;
                    })
                    .style({
                        'font-weight':700,
                        'fill':'#808080'
                    })
                    .attr('x', function(d, i) {
                        return (i * 140) + 18;
                    })
                    .attr('y', 11);
                 */

                svg.selectAll('text.dom')
                    .data(dom)
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#fff',
                        'font-weight':700,
                        'font-size':'14px'
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + 15;
                    })
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable) + 16;

                    });

                svg.selectAll('text.exp')
                    .data(exp)
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#fff',
                        'font-weight':700,
                        'font-size':'14px'
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(1) + 15;
                    })
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable) + 16;

                    });

                svg.selectAll('text.ana')
                    .data(ana)
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#fff',
                        'font-weight':700,
                        'font-size':'14px'
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(2) + 15;
                    })
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable) + 16;

                    });

                svg.selectAll('text.ama')
                    .data(ama)
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#fff',
                        'font-weight':700,
                        'font-size':'14px'
                    })
                    .attr('x', function(d, i) {
                        return (i * (barWidth + barPadding)) + paddingLeft + patternDivision(3) + 15;
                    })
                    .attr('y', function(d, i) {
                        return svgHeight + paddingTop - (d * svgHeightVariable) + 16;

                    });

                svg.selectAll('text.scale')
                    .data(ranges)
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", 'end')
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#ccc',
                        'font-weight':400,
                        'font-size':'13px'
                    })
                    .attr('x', 30)
                    .attr('y', function(d, i) {
                        return (i * (svgHeight / 10)) + paddingTop + 4;
                    });

                svg.selectAll('text.patterns')
                    .data(['Dominant', 'Expressive', 'Analytical', 'Amiable'])
                    .enter()
                    .append('text')
                    .attr("class", "number")
                    .attr("text-anchor", 'middle')
                    .text(function(d) {
                        return d;
                    })
                    .style({
                        'fill': '#ccc',
                        'font-weight':400,
                        'font-size':'13px'
                    })
                    .attr('x', function(d, i) {
                        return patternDivision(i + 1) - 30
                    })
                    .attr('y', svgHeight + 40);


            }
        }
    })




module.directive('closelightbox',function(){
    var linker = function(scope,element,attrs) {
        element.click(function(){
            element.colorbox.close();
        });
    };

    return {
        restrict:'AC',
        link: linker
    }
});
module.directive('fallbackSrc', function () {
    var fallbackSrc = {
        link: function postLink(scope, iElement, iAttrs) {
            iElement.bind('error', function() {
                angular.element(this).attr("src", iAttrs.fallbackSrc);
            });
        }
    }
    return fallbackSrc;
});
module.directive('colorbox',function(){
    var linker = function(scope,element,attrs) {
        element.colorbox(
            {
                inline:true,
                width:"500px",
                transition: "fade",
                overlayClose: false,
                speed: 0,
                scrolling: false,
                opacity:.5,
                height: 300,
                className: "colormebox"
            }
        );
    };
    return {
        restrict:'AC',
        link: linker
    }
});

module.directive('breadcrumb',function($document, $parse){
    var linker = function(scope,element,attrs,ngModel,Restangular) {
        var stepNumber = attrs.stepnumber;
        var currentNumberObject = attrs.breadcrumb;
        scope.$watch(currentNumberObject, function(){
            var getter = $parse(currentNumberObject);


            //If we are on the current step
            if(getter(scope) == stepNumber){
                element.removeClass("small");
            } else {
                element.addClass("small");
            }

            if(getter(scope)< currentNumberObject){
                element.children('a').remove();
                element.wrapInner('<a href="#"></a>');

            } else {
                element.children('a').remove();
            }


        });

    };

    return {
        restrict:'A',
        link: linker
    }
});

module.directive('onblursaveinterviewquestion', function(Restangular) {
    return function(scope, elem, attrs) {
        elem.focusout(function(){
            var id = attrs['onblursaveinterviewquestion'];
            if(elem.val() != ""){
                Restangular.one('JInterviewQuestions',id ).get().then(function(response){
                    response.interview_questions = elem.val();
                    response.put();
                })
            }


        });
    }
});
module.directive('onblursaveinterviewscore', function() {
    var linker = function(scope, elem, attrs,ctrl) {
        elem.focusout(function(){
            if(scope.parentform.$valid){
                var id = attrs['onblursaveinterviewscore'];
                scope.saveScore(id,elem.val());
            } else {
                console.log("One of the interview questions is invalid");
            }



        });
    }

    return {
        restrict:'A',
        link: linker
    }
});
module.directive('onblursaveinterviewnotes', function(Restangular) {
    return function(scope, elem, attrs) {
        elem.focusout(function(){
            var id = attrs['onblursaveinterviewnotes'];
            scope.saveNotes(id,elem.val());

        });
    }
});
module.directive('onblursavegroup', function($parse) {
    return function(scope, elem, attrs) {
        elem.focusout(function(){
            var object = attrs.parent;
            var getter = $parse(object);
            scope.saveGroup(getter(scope));
        });
    }
});


module.directive('ngPopup', function(Popup){
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var ngPopupUrl = attrs['ngPopup'];
            // Could have custom or boostrap modal options here
            var popupOptions = {};

            element.bind( "click", function(){
                Popup.load(ngPopupUrl, scope, popupOptions);
            });
        }
    };
});
module.directive('gohome', function($state){
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {

            element.bind( "click", function(){
                $state.transitionTo("apAccount.default");
            });
        }
    };
});
module.directive('ngConfirm', function(Popup) {
    return {
        restrict: 'AE',
        link: function postLink(scope, element, attrs) {
            // Could have custom or boostrap modal options here
            var popupOptions = {};
            element.bind("click", function() {
                Popup.confirm(attrs["title"], attrs["actionText"],
                    attrs["actionButtonText"], attrs["actionFunction"],
                    attrs["cancelButtonText"], attrs["cancelFunction"],
                    scope, popupOptions);
            });
        }
    };
});

module.directive('ngAlert', function(Popup) {
    return {
        restrict: 'E',
        link: function postLink(scope, element, attrs) {
            // Could have custom or boostrap modal options here
            var popupOptions = {};
            element.bind("click", function() {
                Popup.alert(attrs["title"], attrs["text"],
                    attrs["buttonText"], attrs["alertFunction"],
                    scope, popupOptions);
            });
        }
    };
});

module.directive('sameAs', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {
                if (viewValue === scope[attrs.sameAs]) {
                    ctrl.$setValidity('sameAs', true);
                    scope.SameAsError = false;
                    return viewValue;
                } else {
                    scope.SameAsError = true;
                    return undefined;
                }
            });
        }
    };
});


module.directive('backbutton', function(){
    return {
        restrict: 'A',

        link: function(scope, element, attrs) {
            element.bind('click', goBack);
            function goBack() {
                history.back();
                scope.$apply();
            }
        }
    }
});

module.directive('focusMe', function($timeout) {
    return {
        link: function(scope, element,attrs) {
            attrs.$observe('focusMe',function(value){
                if(value == undefined)
                    return;
                if(value === "true") {
                    $timeout(function() {
                        element.focus();
                    });
                }
            });
            scope.$watch('trigger', function(value) {

            });
        }
    };
});
