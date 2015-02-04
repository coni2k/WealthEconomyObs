//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

(function () {
    'use strict';

    var controllerId = 'elementFieldListController';
    angular.module('main')
        .controller(controllerId, ['elementFieldService',
            'logger',
			elementFieldListController]);

    function elementFieldListController(elementFieldService,
        logger) {
        logger = logger.forSource(controllerId);

        var vm = this;
        vm.deleteElementField = deleteElementField;
        vm.elementFieldSet = [];

        initialize();

        function initialize() {
            getElementFieldSet();
        };

        function deleteElementField(elementField) {
            elementFieldService.deleteElementField(elementField);

            elementFieldService.saveChanges()
                .then(function () {
                    vm.elementFieldSet.splice(vm.elementFieldSet.indexOf(elementField), 1);
                    logger.logSuccess("Hooray we saved", null, true);
                })
                .catch(function (error) {
                    logger.logError("Boooo, we failed: " + error.message, null, true);
                    // Todo: more sophisticated recovery. 
                    // Here we just blew it all away and start over
                    // refresh();
                })
        };

        function getElementFieldSet() {
            elementFieldService.getElementFieldSet(false)
			    .then(function (data) {
                    vm.elementFieldSet = data;
                });
        }
    };
})();