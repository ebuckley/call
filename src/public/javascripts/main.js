angular.module('cl', ['ui.bootstrap', 'eb.util']);

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
			name: 'Update',
			click: function () {
				var updater = $scope.peopleUpdater;
				$modal.open({
					templateUrl: '/templates/clAddPeople.html',
					size: 'lg',
					controller: function ($scope) {
						$scope.peopleModel = _.clone(updater.get());
					}
				}).result.then(function(data) {
					$scope.peopleUpdater.update(data);
				});
			}
		},
		{
			name: 'Reset',
			click: function () {
				var updater = $scope.peopleUpdater;
				var resetPeople = _.map($scope.model.people, function (item) {
					item.isHere = false;
					return item;
				});
				$scope.peopleUpdater.update();
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
.factory('socketCollection', function (socket ){
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
					socket.emit('updatePeopleFromClient', JSON.parse(angular.toJson(newPeople)));
				}
			};
		}

		var instance = new SocketUpdater();
		socket.on('updatePeopleFromServer', function(data) {
			server.people = data;
			server.lastUpdate = Date.now();
			instance.serverUpdated(server);
		});
		return instance;
	};
	return socketCollection;
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
		},
		link: function (scope) {
			scope.isHidden = false;
		}
	};
});

angular.module('eb.util', [])
.factory('socket', function ($rootScope) {
	//should be loaded in provider for config stage
	var socket = io(),
		socketObj = {};

	socketObj.emit = function (key, value) {
		console.log(_.now(), 'emiting', key, value);
		socket.emit(key, value);
	};

	socketObj.on = function (key, cb) {
		socket.on(key, function (data) {
			$rootScope.$apply(function () {
				console.log(_.now(), 'handling', key, data);
				cb(data);
			});
		});
	};
	return socketObj;
});
