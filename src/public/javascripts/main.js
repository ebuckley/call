angular.module('cl', ['ui.bootstrap']);

angular.module('cl')
.controller('pageCtrl', function ($scope, $modal, socketCollection ) {

	
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

	/**
	 * change a person to be here if not here, or vice versa.
	 */
	var toggleIsHere = function (person) {
		person.isHere = !person.isHere;
		$scope.peopleUpdater.update($scope.model.people);
	};

	//create nav model
	$scope.navObject = {};
	$scope.navObject.links = [
		{
			name: 'Shuffle',
			click: shufflePeople
		},
		{
			name: 'Add',
			click: function () {
				var updater = $scope.peopleUpdater;
				$modal.open({
					templateUrl: '/templates/clAddPeople.html',
					controller: function ($scope) {
						$scope.peopleModel = _.clone(updater.get());
					}
				}).result.then(function(data) {
					$scope.peopleUpdater.update(data);
				});
			}
		}
	];

	// setup the server socket.io collection
	$scope.peopleUpdater = 	socketCollection.create({
		serverUpdated: function (data) {
			$scope.model.people = data.people;
		},
	});

	
	//setup the 2 listgroups of people
	$scope.herePeople = {
		clickItem: toggleIsHere,
		title: 'Here',
		filter: function (item) {
			return item.isHere;
		},
		updater: $scope.peopleUpdater
	};

	$scope.notHerePeople = {
		clickItem: toggleIsHere,
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
})
.directive('clJson', function ($filter) {
	return {
		restrict: 'E',
		template: '<textarea ng-model="view" class="form-control"></textarea>',
		require: '?ngModel',
		link: function (scope, el, attr, ngModel) {
			if (!ngModel) return;
			ngModel.$render = function () {
				scope.view = $filter('json')(ngModel.$viewValue);
				//resize textbox
				_.defer(updateSize);
			};

			scope.errors = [];

			var updateSize = function () {
				var textbox = el.find('textarea');
				textbox.css('height', '1px');
				textbox.css('height', 10 + textbox[0].scrollHeight + 'px');
			};
			el.on('blur keyup change', function () {
				scope.$apply(read);
			});

			function read() {
				try {
					ngModel.$setViewValue(JSON.parse(scope.view));
					if (el.hasClass('has-error')) {
						el.removeClass('has-error');
					}
				} catch (e) {
					if ( !el.hasClass('has-error')) {
						el.addClass('has-error');
					}
				}
			}
		}
	};
})
.directive('clListgroup', function () {
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