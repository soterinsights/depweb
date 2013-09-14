$(document).ready(function() {
  dwui = $dwui.preloadForm($('#dw_text').val());
  dwui.refresh();
  Sammy('body', function() {
    this.get(/^\/depweb(|-dev)\/$/, function() {
      this.redirect("#/list");
    });
    this.get('#/web/:web', function() {
      //console.log(this.params['web']);
      $('.grapharea div').hide();
      $('#dw_graph').show();
      $.get('./store/api.php?webid='+this.params['web'], null, 'json')
        .done(function(data) {
          //var dobj = JSON.parse(data);
          //dwui.saveForm.dispayname(data.dispayname);
          $('#save input[name="form_save_displayname"]').val(data.displayname)
          $('#save input[name="form_save_exposure"]').val(data.exposure)
          $('#save input[name="form_save_expiration"]').val(data.expiration)

          if(data.errmsg) {
            $dwui.errMsg(data.errmsg);
          } else {
            dwui.fromJSON(JSON.stringify(data.web, null, " "));
            //dwui.menuview();
            dwui.refresh();
          }
        });
    }); //end #/web/:web

    var listhandler = function() {
      $('.grapharea div').hide();
      $('#dw_list').show();
      console.log($('#dw_list'))
      var page = this.params['p'] || 0;
      console.log('./store/api.php?list&p='+page);
      dwui.ko.list().splice(0,dwui.ko.list().length)
      $.get('./store/api.php?list&p='+page, null, 'json')
        .done(function(d) {
          /*if(typeof dwui.ko.list == 'undefined') {
            dwui.ko.list = ko.mapping.fromJS(d);
          } else {
            ko.mapping.fromJS(d, dwui.ko.list);
            console.log(dwui.ko.list())
          }*/
          d.forEach(function(v) {
            dwui.ko.list().push(v);
          });
          dwui.ko.list.valueHasMutated();
          dwui.refresh();
        }).fail(function() {
          debugger;
        });
    };
    this.get("#/list", listhandler);
    this.get("#/list/:p", listhandler);
    //end #/list
    this.get('#/edit', function() {
      $('.grapharea div').hide();
      $('#dw_graph').show();
    });
    //end edit
  }).run();
});
