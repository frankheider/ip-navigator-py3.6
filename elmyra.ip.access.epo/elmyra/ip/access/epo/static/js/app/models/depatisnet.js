// -*- coding: utf-8 -*-
// (c) 2014 Andreas Motl, Elmyra UG

DepatisnetSearch = DatasourceSearch.extend({
    url: '/api/depatisnet/published-data/search',
});

DepatisnetCrawler = Marionette.Controller.extend({

    initialize: function(options) {
        log('DepatisnetCrawler.initialize');
        options = options || {};
        this.query = options.query;
        this.constituents = options.constituents;
    },

    crawl: function() {
        var deferred = $.Deferred();
        var url_tpl = _.template('/api/depatisnet/published-data/crawl/<%= constituents %>?query=<%= query %>');
        var url = url_tpl({constituents: this.constituents, query: this.query});
        var _this = this;
        $.ajax({url: url, async: true})
            .success(function(payload) {
                if (payload) {
                    if (_this.constituents == 'pub-number') {
                        var numberlist = payload['numbers'];
                        deferred.resolve(numberlist);
                    } else {
                        deferred.reject('Unknown constituents "' + _this.constituents + '"');
                    }
                } else {
                    deferred.reject('Empty response');
                }
            }).error(function(error) {
                deferred.reject('API failed', error);
            });
        return deferred;
    },

});

DepatisConnectFulltext = Marionette.Controller.extend({

    initialize: function(document_number) {
        log('DepatisConnectFulltext.initialize');
        this.document_number = document_number;
    },

    get_claims: function() {

        var _this = this;
        var deferred = $.Deferred();

        var url = _.template('/api/depatisconnect/<%= document_number %>/claims')({ document_number: this.document_number});
        $.ajax({url: url, async: true}).success(function(payload) {
            if (payload) {
                var response = {
                    html: payload['xml'],
                    lang: payload['lang'],
                };
                deferred.resolve(response);
            }
        }).error(function(error) {
            console.warn('Error while fetching claims from DEPATISconnect for', _this.document_number, error);
            deferred.resolve({html: 'No data available'});
        });

        return deferred.promise();

    },

    get_description: function() {

        var _this = this;
        var deferred = $.Deferred();

        var url = _.template('/api/depatisconnect/<%= document_number %>/description')({ document_number: this.document_number});
        $.ajax({url: url, async: true})
            .success(function(payload) {
                if (payload) {
                    var response = {
                        html: payload['xml'],
                        lang: payload['lang'],
                    };
                    deferred.resolve(response);
                }
            }).error(function(error) {
                console.warn('Error while fetching description from DEPATISconnect for', _this.document_number, error);
                deferred.resolve({html: 'No data available'});
            });

        return deferred.promise();

    },

    get_abstract: function(language) {

        var _this = this;
        var deferred = $.Deferred();

        var url_tpl = '/api/depatisconnect/<%= document_number %>/abstract'
        if (language) {
            url_tpl += '?language=<%= language %>'
        }
        var url = _.template(url_tpl)({ document_number: this.document_number, language: language});
        $.ajax({url: url, async: true})
            .success(function(payload) {
                if (payload && payload['xml']) {
                    var response = {
                        html: payload['xml'],
                        lang: payload['lang'],
                    };
                    deferred.resolve(response);

                } else {
                    console.warn('DEPATISconnect: Empty abstract for', _this.document_number);
                    deferred.reject({html: 'Abstract for this document is empty, see original data source'});
                }
            }).error(function(error) {
                console.warn('DEPATISconnect: Error while fetching abstract for', _this.document_number, error);
                deferred.reject({html: 'No data available', error: error});
            });

        return deferred.promise();

    },

});
