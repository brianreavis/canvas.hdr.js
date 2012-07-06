IN=canvas.hdr.js
OUT=canvas.hdr.min.js

all:	
	curl -s -d compilation_level=SIMPLE_OPTIMIZATIONS \
	        -d output_format=text \
	        -d output_info=compiled_code \
	        --data-urlencode "js_code@${IN}" \
	        http://closure-compiler.appspot.com/compile \
	        > ${OUT}