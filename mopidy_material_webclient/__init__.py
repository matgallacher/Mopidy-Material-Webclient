from __future__ import unicode_literals


import logging
import os
import string
import json
import tornado.web
import subprocess

from configobj import ConfigObj, ConfigObjError
from validate import Validator
from wifi import Cell, Scheme
from mopidy import config, ext


__version__ = '0.2.2'

# TODO: If you need to log, use loggers named after the current Python module
logger = logging.getLogger(__name__)
spec_file = os.path.join(os.path.dirname(__file__), 'settingsspec.ini')


class Extension(ext.Extension):

    dist_name = 'Mopidy-Material-Webclient'
    ext_name = 'material-webclient'
    version = __version__

    def get_default_config(self):
        conf_file = os.path.join(os.path.dirname(__file__), 'ext.conf')
        return config.read(conf_file)

    def get_config_schema(self):
        schema = super(Extension, self).get_config_schema()
        schema['config_file'] = config.String()
        return schema

    def setup(self, registry):
        registry.add('http:app', {'name': self.ext_name, 'factory': self.factory})

    def factory(self, config, core):
        from tornado.web import StaticFileHandler
        path = os.path.join(os.path.dirname(__file__), 'static')
        return [(r'/wifi', WifiHandler),
            (r'/settings', SettingsHandler, {'core': core, 'config': config}),
            (r'/restart', RestartHandler),
            (r'/extensions', ExtensionsHandler),
            (r'/(.*)', StaticFileHandler, {'path': path, 'default_filename': 'index.html'})]


#
#Get a list of wifi networks in range
#
class WifiHandler(tornado.web.RequestHandler): 

    def get(self):
        cells = Cell.all('wlan0')
        items = []
        for cell in cells:
            items.append(cell.__dict__)

        self.write(json.dumps(items))


 #
 #This section is entirely lifted from the brilliant
 #https://github.com/woutervanwijk/mopidy-websettings
 #updated to provide the settings as a RESTful json service
 #
class SettingsHandler(tornado.web.RequestHandler):

	def initialize(self, core, config):
		self.config_file = config.get('material-webclient')['config_file']
		self.core = core

	def get(self):
		validItems = ConfigObj(self.config_file, encoding='utf8')
		self.write(validItems)

	def post(self):
		logger.info('Reading data from post')
		data = json.loads(self.request.body)
		logger.info(data)
		cfg = ConfigObj(self.config_file, encoding='utf8')
		
		if cfg['network']['hostname'] != data['network']['hostname']:
            		os.system('sh hostname.sh {0}'.format(data['network']['hotname']))
        
        	if cfg['network']['wifi_network'] != data['network']['wifi_network']:
            		os.system('sh wifi.sh "{0}" "{1}"'.format(data['network']['wifi_network'], data['network']['wifi_password']))
        
        	for itm in data:
			for subitm in data[itm]:
				cfg[itm][subitm] = data[itm][subitm]
        
        	cfg.write()
        	self.write('{ "message": "Settings saved, system going down now!" }')
        	logger.info('Material webclient rebooting system')
        	os.system('reboot')

#
#At least require a post to restart
#
class RestartHandler(tornado.web.RequestHandler):
    def post(self):
        self.write('{ "message": "System going down now!" }')
        logger.info('Material webclient rebooting system')
        os.system('reboot')

class ExtensionsHandler(tornado.web.RequestHandler): 
    def get(self):
        outdated = self.get_argument('outdated', default='false')
        packages = {}

        if outdated == 'true':
            installed = subprocess.check_output(['/usr/local/bin/pip', 'list', '-o'])
            for itm in installed.split('\n'):
                parts = itm.split(' ')
                if len(parts) > 1:
                    packages[parts[0]] = { 'current': parts[2], 'latest': parts[4] }
        else:
            installed = subprocess.check_output(['/usr/local/bin/pip', 'list'])
            for itm in installed.split('\n'):
                parts = itm.split(' ')
                if len(parts) > 1:
                    packages[parts[0]] = parts[1]

        self.write(json.dumps(packages))

    def post(self):
        extension = self.get_argument('extension', default='')
        if extension != '':
            installed = subprocess.check_output(['/usr/local/bin/pip', 'install', extension, '--upgrade'])
            self.write('{ "message": "Updates installed, system going down now!" }')
            os.system('reboot')
