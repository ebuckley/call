angular.module('cl', []);

angular.module('cl')
.controller('pageCtrl', function ($scope, socketCollection, listGroupFactory) {

	
	//todo reconsider naming
	$scope.model = {};
	$scope.model.people = [];

	/**
	 * shuffle people
	 * Causes side effects on scope
	 */
	function shufflePeople() {
		$scope.model.people = _.shuffle($scope.model.people);
		$scope.peopleUpdater.update($scope.model.people);
	}

	//create nav model
	$scope.navObject = {};
	$scope.navObject.links = [
		{
			name: 'Shuffle',
			click: shufflePeople
		},
		{
			name: 'Add',
			click: shufflePeople
		}
	];



	// setup the server socket.io collection
	$scope.peopleUpdater = 	socketCollection.create({
		serverUpdated: function (data) {
			$scope.model.people = data.people;
		},
	});

	var changePerson = function (person) {
		person.isHere = !person.isHere;
		$scope.peopleUpdater.update($scope.model.people);
	};

	//setup the 2 listgroups of people
	$scope.herePeople = {
		clickItem: changePerson,
		title: 'Here',
		filter: function (item) {
			return item.isHere;
		},
		updater: $scope.peopleUpdater
	};

	$scope.notHerePeople = {
		clickItem: changePerson,
		title: 'Not Here',
		filter: function (item) {
			return !item.isHere;
		},
		updater: $scope.peopleUpdater
	};
})
//TODO REFACTOR INTERNAL NAMING
.factory('socketCollection', function (clSocket ){
	var server = {
		people: [],
		lastUpdate: 'never'
	};

	/**
	 * updateFromServerInterface
	 *   - serverUpdated(data)
	 */
	var socketCollection = {};

	socketCollection.create = function (userOpts) {
		var opts = {
			serverUpdated: function () {
				console.log('when creating a people object you should implement iUpdateFromServer!');
			}
		};
		_.extend(opts, userOpts);

		//People Updater class
		function SocketUpdater() {
			this.get = function () {
				return server.people;
			};
			this.serverUpdated = opts.serverUpdated;
			this.update = function (newPeople) {
				if (angular.isDefined(newPeople)) {
					clSocket.emit('updatePeopleFromClient', JSON.parse(angular.toJson(newPeople)));
				}
			};
		}

		var instance = new SocketUpdater();
		clSocket.on('updatePeopleFromServer', function(data) {
			server.people = data;
			server.lastUpdate = Date.now();
			instance.serverUpdated(server);
		});
		return instance;
	};
	return socketCollection;
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
}).directive('clListgroup', function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/listgroup.html',
		scope: {
			model: '=',
		},
	};
}).directive('clNav', function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/clNav.html',
		scope: {
			model: '='
		}
	};
});