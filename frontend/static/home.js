/*
 Copyright 2011 The Go Authors.  All rights reserved.
 Use of this source code is governed by a BSD-style
 license that can be found in the LICENSE file.
*/

/* the response from /api/groups should look like:
    {
        "Groups": [{
            "Name": "GoSV",
            "Link": "http://www.meetup.com/golangsv",
            "Members": 194,
            "City": "San Mateo",
            "Country": "US",
            "Lat": 12.0,
            "Lon": 10.0
        }, {
            "Name": "GoSF",
            "Link": "http: //www.meetup.com/golangsf",
            "Members": 1393,
            "City": "San Francisco",
            "Country": "US",
            "Lat": 10.0,
            "Lon": 15.0
        }],
        "Error": "something bad happened"
    }
*/
function GroupsCtrl($scope, $http, $filter) {
    'use strict';

    $scope.groups = [];
    $scope.errors = [];
    $scope.search = {};
    $scope.filteredFields = ['Name', 'City', 'Country'];
    $scope.filteredGroups = [];

    $scope.refilter = function() {
        for (var f in $scope.filteredFields) {
            var field = $scope.filteredFields[f];
            if ($scope.search[field] === '') delete $scope.search[field];
        }
        $scope.filteredGroups = $filter('filter')($scope.groups, $scope.search);
        paintMap($scope.filteredGroups);
    };

    $scope.totalSum = function() {
        var n = 0;
        for (var i in $scope.filteredGroups) n += $scope.filteredGroups[i].Members;
        return n;
    };

    $http.get('/api/groups').then(function(res) {
        $scope.groups = res.data.Groups;
        if (res.data.Error && res.data.Error.length > 0) {
            $scope.log(res.data.Error);
        }
        $scope.refilter();
    }, function(msg) {
        $scope.log(msg.data);
    });

    $scope.log = function(msg) {
        $scope.errors.push(msg);
    };
}

function paintMap(groups) {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 1,
        center: {lat: 0, lng: 0}
    });
    groups = groups || [];
    var markers = groups.map(function(g) {
        if (g.Lat == 0 || g.Lon == 0) return;

        var infoWindow = new google.maps.InfoWindow({
            content: groupContent(g)
        });
        var marker = new google.maps.Marker({
            position: {
                lat: g.Lat + Math.random()/50.0,
                lng: g.Lon + Math.random()/50.0},
            title: g.Name,
            map: map
        });
        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        })
        return marker;
    })

    new MarkerClusterer(map, markers, {
        imagePath: '/m',
        maxZoom: 10,
    });
}

function groupContent(g) {
    return '<h3>'+g.Name+'</h3>'
        + '<p>' + g.Members + ' gophers</p>'
        + '<a href="' + g.Link + '">go to page</a>';
}