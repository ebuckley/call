g = require 'glob'
q = require 'q'
child = (require 'child_process')
Rsync = require 'rsync'

config =
	# set the remote path (medivac host in this example)
	remote_path: 'medivac:~/tmpapp'

#make a promisified and nice to use spawn function
spawn = (cmd_name, args) ->

	later = q.defer()

	cmd = child.spawn cmd_name, args
	error_buffers = []
	output_buffers = []

	join_buffer = (buff_array) ->
		buff_array.map( (item) ->
			item.toString()
		).join('')
	
	cmd.stderr.on 'data', (dat) ->
		error_buffers.push dat

	cmd.stdin.on 'data', (dat) ->
		output_buffers.push dat

	cmd.on 'close', (code) ->
		response =
			output: join_buffer(output_buffers)
			error: join_buffer(error_buffers)
		if code == 0
			later.resolve response
		else
			later.reject response

	#promise you results will come when the process finishes
	later.promise


module.exports = (grunt) ->
	
	grunt.registerTask 'movetodir', 'build into ./build', ->

		ok = this.async()
		cp = spawn 'cp', ['-rfv', __dirname + '/src', __dirname + '/build']

		cp.then((d)->
			grunt.log.writeln d.output
			ok()
		, (d) ->
			grunt.log.writeln d.error
			ok()
		)

	grunt.registerTask 'clean', 'clean ./build directory', ->

		ok = this.async()
		rm = spawn 'rm', ['-rfv', __dirname + '/build']	

		rm.then((d)->
			grunt.log.writeln d.output
			ok()
		, (d) ->
			grunt.log.writeln d.error
			ok()
		)

	grunt.registerTask 'default', ['clean', 'movetodir', 'deploy']

	# move build dir contents to the server
	grunt.registerTask 'deploy', ->

		ok = this.async()
		rsync = Rsync()
		.shell('ssh')
		.flags('az')
		.source('./build')
		.destination(config.remote_path)

		rsync.execute( ->
			grunt.log.writeln(arguments).ok()
			ok()
		)

		
		
