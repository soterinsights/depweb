var dwui;
$(document).ready(function() {
  var loadform = function(json) {
    dwui = $dwui.preloadForm(json, {
      element: '#dwmap'
    });
    dwui.refresh();
  };

  //this functionality should be moved to dwui
  var showhidemap = function(active, chained) {
    active = active || 'dwmap';
    var timeout = 1000;
    var m = {
      about: {
        show: function() { $("#about").show(timeout); },
        hide: function() { $("#about").hide(timeout); }
      },
      listing: {
        show: function() { $('#listing').show(timeout); },
        hide: function() { $('#listing').hide(timeout); }
      },
      'new': {
        show: function() { dwui.menuview(); },
        hide: function() { dwui.menuview(true) }
      },
      helpbar: {
        show: function() { $("#helpbar").show(timeout); },
        hide: function() { $("#helpbar").hide(timeout); }
      }
    };
    for(var i in m) {
      if(i == active) { m[i].show(); }
      else if(typeof chained == 'boolean' && chained) { m[i].show(); }
      else { m[i].hide(); }
    }
    return;
    switch(active) {
      case 'about':

        break;
      case 'listing':
        $('#listing').show(500);
        dwui.menuview(true);
        break;
      case 'new':
        $('#listing').hide(500);
        dwui.menuview();
        break;
      default: //dwmap
        //hide listing
        //hide editor
        $('#listing').hide(500);
        dwui.menuview(true);
        break;
    }
  };
  var finished = function() {
    Sammy('body', function() {
      /*this.get(/^\/depweb(|-dev)\/$/, function() {
        this.redirect("#/list");
      });*/
      this.get('#/web/:web', function() {
        showhidemap() //default action
        //console.log(this.params['web']);
        //$('.grapharea div').hide();
        //$('#dwmap').show();
        $.get('./store/api.php?webid='+this.params['web'], null, 'json')
          .done(function(data) {
            //redo these as knockouts?
            $('#save input[name="form_save_displayname"]').val(data.displayname)
            $('#save input[name="form_save_exposure"]').val(data.exposure)
            $('#save input[name="form_save_expiration"]').val(data.expiration)

            if(data.errmsg) {
              $dwui.errMsg(data.errmsg);
            } else {
              dwui.fromJSON(JSON.stringify(data.web, null, " "));
              dwui.refresh();
            }
          });
      }); //end #/web/:web
      var listhandler = function() {
        showhidemap('listing')
        var page = this.params['p'] || 0;
        dwui.ko.currentPage(page);
        dwui.ko.list().splice(0, dwui.ko.list().length)
        $.get('./store/api.php?list&p='+page, null, 'json')
          .done(function(d) {
            d.forEach(function(v) {
              dwui.ko.list().push(v);
            });
            dwui.ko.list.valueHasMutated();
            dwui.refresh();
          }).fail(function() {
            //error
          });
      };
      this.get("#/list", listhandler);
      this.get("#/list/", listhandler);
      this.get("#/list/:p", listhandler);
      //end #/list
      /*this.get('#/edit', function() {
        $('.grapharea div').hide();
        $('#dw_graph').show();
      });//end #/edit*/

      this.get('#/new', function() {
        showhidemap('new');
        dwui.fromJSON('[]');
        $('#save input[name="form_save_displayname"]').val('')
        $('#save input[name="form_save_exposure"]').val('')
        $('#save input[name="form_save_expiration"]').val('')
      }); //end #/new
      var about = function() {
        showhidemap('about');
      };
      this.get('#/about', about);
      this.get(/(\/|\.html)$/i, function() {
        about();
        $.get('./store/api.php?webid=dw5232acd6bd65b', null, 'json')
          .done(function(data) {
            //redo these as knockouts?
            $('#save input[name="form_save_displayname"]').val(data.displayname)
            $('#save input[name="form_save_exposure"]').val(data.exposure)
            $('#save input[name="form_save_expiration"]').val(data.expiration)

            if(data.errmsg) {
              $dwui.errMsg(data.errmsg);
            } else {
              dwui.fromJSON(JSON.stringify(data.web, null, " "));
              dwui.refresh();
            }
          });
      }); //end #/about

      this.get('#/help', function() {
        console.log(arguments)
        showhidemap('helpbar');
      }); //end #/hep
    }).run();
  }

  $.getJSON('./data.json')
    .fail(loadform.bind({}, JSON.parse($('#dw_text').val())))
    .done(loadform).always(finished);
});