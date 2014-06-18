angular.module('cl', [])
.controller('pageCtrl', function ($scope, peopleFactory) {

	$scope.buttonbar = {
		shuffle: function () {
			console.log('shuffling $scope.people');
			$scope.people = _.shuffle($scope.people);
			$scope.peopleUpdater.update($scope.people);
		}
	};

	$scope.change = function (person) {
		person.isHere = !person.isHere;
		$scope.peopleUpdater.update($scope.people);
	};

	$scope.$watch('people', function (newPeople) {
		$scope.peopleUpdater.update(newPeople);
	}, true);
	
	$scope.peopleUpdater = 	peopleFactory.create({
		serverUpdated: function (data) {
			$scope.people = data.people;
		},
	});

})
.factory('peopleFactory', function (clSocket ){
	var server = {
		people: [],
		lastUpdate: 'never'
	};

	/**
	 * updateFromServerInterface
	 *   - serverUpdated(data)
	 */
	var peopleFactory = {};

	peopleFactory.create = function (userOpts) {
		opts = {
			serverUpdated: function () {
				console.log('when creating a people object you should implement iUpdateFromServer!');
			}
		};
		_.extend(opts, userOpts);

		//People Updater class
		function PeopleUpdater() {
			this.serverUpdated = opts.serverUpdated;
			this.update = function (newPeople) {
				if (angular.isDefined(newPeople)) {
					clSocket.emit('updatePeopleFromClient', JSON.parse(angular.toJson(newPeople)));
				}
			};
		}

		var instance = new PeopleUpdater();
		clSocket.on('updatePeopleFromServer', function(data) {
			server.people = data;
			server.lastUpdate = Date.now();
			instance.serverUpdated(server);
		});
		return instance;
	};
	return peopleFactory;
})
.factory('clSocket', function ($rootScope) {
	//should be loaded in provider for config stage
	var socket = io(),
		clSocket = {};

	clSocket.emit = function (key, value) {
		console.log(_.now(), 'emiting', key, value);
		socket.emit(key, value);
	};

	clSocket.on = function (key, cb) {
		socket.on(key, function (data) {
			$rootScope.$apply(function () {
				console.log(_.now(), 'handling', key, data);
				cb(data);
			});
		});
	};
	return clSocket;
}).directive('peopleCollection', function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/listgroup.html',
		scope: {
			collection: '=source',
			collectionFilter: '=filter'
		}
	};
}).directive('clTitle', function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/clTitle.html',
		scope: {
			buttonbar: '='
		},
		link: function (scope, el, attr) {
			scope.content = attr.content;
			var shuffleButton = el.find('.shuffle-btn');
			shuffleButton.hide();

			el.bind('mouseleave', function () {
				shuffleButton.fadeOut();
			});

			el.bind('mouseenter',  function () {
				shuffleButton.fadeIn();
			});
		}
	};
});