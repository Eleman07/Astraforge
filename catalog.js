/** Curated Python 3.14/Pyodide 314.0.7 discipline catalogue.
 * 'browser' = built by official Pyodide distribution; 'bundled' = same-origin wheel;
 * 'external' = requires an environment outside GitHub Pages. */
export const PYODIDE_VERSION = '314.0.7';
export const MODULES = [
// FOUNDATIONS
['numpy','NumPy','Numerical arrays & linear algebra','Mathematics'],
['scipy','SciPy','Optimization, ODEs, integration & signal processing','Mathematics'],
['sympy','SymPy','Symbolic algebra & calculus','Mathematics'],
['matplotlib','Matplotlib','Scientific plots','Visualization'],
['pandas','pandas','Tabular data analysis','Data'],
['mpmath','mpmath','Arbitrary-precision mathematics','Mathematics'],
['uncertainties','uncertainties','Error propagation','Mathematics'],
['unyt','unyt','Physical units & quantities','Physics'],
['networkx','NetworkX','Graphs and networks','Mathematics'],
['statsmodels','statsmodels','Statistical models & time series','Statistics'],
['xarray','xarray','Multidimensional scientific data','Data'],
['h5py','h5py','HDF5 data files','Data'],
['zarr','Zarr','Chunked array storage','Data'],
['netcdf4','netCDF4','Climate and simulation datasets','Data'],
['polars','Polars','Columnar dataframes','Data'],
['duckdb','DuckDB','Analytical SQL engine (in-process)','Database'],
['sqlalchemy','SQLAlchemy','ORM and SQL expression toolkit','Database'],
['peewee','Peewee','Small SQLite-friendly ORM','Database'],
['pyarrow','PyArrow','Columnar Arrow formats','Data'],
['altair','Altair','Declarative charts','Visualization'],
['bokeh','Bokeh','Interactive plots (browser integration varies)','Visualization'],
['pillow','Pillow','Raster image processing','Visualization'],
// AEROSPACE / PHYSICS / MECH
['astropy','Astropy','Coordinates, constants, time & astronomy','Aerospace'],
['rebound','REBOUND','N-body orbital integration','Aerospace'],
['reboundx','REBOUNDx','Extended orbital forces','Aerospace'],
['galpy','galpy','Galactic orbit dynamics','Aerospace'],
['healpy','healpy','Spherical pixelization','Aerospace'],
['cartopy','Cartopy','Geographic projections & plotting','Geospatial'],
['pyproj','pyproj','Coordinate reference transformations','Geospatial'],
['shapely','Shapely','Planar computational geometry','Geospatial'],
['geopandas','GeoPandas','Vector geospatial data','Geospatial'],
['casadi','CasADi','Automatic differentiation & optimal control','Controls'],
['nlopt','NLopt','Nonlinear optimization','Optimization'],
['highspy','HiGHS','Linear and mixed-integer optimization','Optimization'],
['clarabel','Clarabel','Conic optimization solver','Optimization'],
['cvxpy-base','CVXPY base','Base components (not the full solver stack)','Optimization'],
['python-solvespace','python-solvespace','Geometric constraints / CAD kernels','Mechanical'],
['sisl','sisl','Atomistic modelling & electronic structure','Materials'],
['coolprop','CoolProp','Thermophysical and refrigerant properties','Thermodynamics'],
['inspice','InSPICE','SPICE circuit tools','Electrical'],
['pywavelets','PyWavelets','Wavelet transforms','Signals'],
// BIOMED / CHEM / AI
['biopython','Biopython','Biological sequence and structure analysis','Biomedical'],
['scikit-image','scikit-image','Scientific image processing','Biomedical'],
['opencv-python','OpenCV','Computer vision (cv2)','Computer vision'],
['soundfile','SoundFile','Audio files','Signals'],
['soxr','soxr','Audio resampling','Signals'],
['nltk','NLTK','Natural language toolkit','AI'],
['scikit-learn','scikit-learn','Classical machine learning','AI'],
['xgboost','XGBoost','Gradient-boosted trees','AI'],
['lightgbm','LightGBM','Gradient boosting','AI'],
['tiktoken','tiktoken','Tokenization','AI'],
['sentencepiece','SentencePiece','Subword tokenizer','AI'],
['safetensors','safetensors','Tensor file format','AI'],
['pydantic','Pydantic','Typed data validation','Software'],
['orjson','orjson','Fast JSON serialization','Software'],
['pyyaml','PyYAML','YAML configuration files','Software'],
['rich','Rich','Formatted console text','Software'],
['pytest','pytest','Python testing','Software'],
['mypy','mypy','Static type checking','Software'],
['beautifulsoup4','Beautiful Soup','HTML parsing','Software'],
['lxml','lxml','XML/HTML processing','Software'],
['httpx','HTTPX','HTTP client (browser restrictions apply)','Software'],
['requests','Requests','HTTP (browser CORS and socket caveats)','Software'],
// MANAGEMENT / TELECOM / MATERIALS
['python-sat','PySAT','Boolean satisfiability problems','Optimization'],
['igraph','igraph','Network & graph analytics','Optimization'],
['vrplib','VRPLIB','Vehicle routing benchmark files','Management'],
['rateslib','rateslib','Cashflows & fixed income','Management'],
['pyxirr','pyxirr','Financial returns / IRR','Management'],
['patsy','Patsy','Statistical design matrices','Statistics'],
['optlang','optlang','Mathematical optimization models','Optimization'],
['bottleneck','Bottleneck','Fast numerical array reductions','Mathematics'],
['scipy',null,null,null], // deduplicated by the export below
['msprime','msprime','Population genetic simulation','Biomedical'],
['tskit','tskit','Tree sequence analysis','Biomedical'],
['rasterio','Rasterio','Geospatial raster datasets','Geospatial'],
['imageio','imageio','Scientific image input/output','Visualization'],
['pyshp','pyshp','Shapefile reading/writing','Geospatial'],
['bitstring','bitstring','Binary protocols & bit-level fields','Telecom'],
['bitarray','bitarray','Efficient bit arrays','Telecom'],
['crcmod','crcmod','CRC generation & checking','Telecom'],
['crc32c','crc32c','Hardware-style CRC32C','Telecom'],
['protobuf','protobuf','Binary message encoding','Telecom'],
['msgpack','msgpack','Compact message serialization','Telecom'],
['numpy',null,null,null] // deduplicated by the export below
].filter((item,index,arr)=>item[1] && arr.findIndex(x=>x[0]===item[0])===index)
.map(([id,name,description,group])=>Object.freeze({id,name,description,group,kind:'browser'}));

export const SPECIAL_MODULES = Object.freeze([
 {id:'sqlite3',name:'SQLite (built-in)',description:'Persistent local relational SQL with zero server cost',group:'Database',kind:'stdlib'},
 {id:'astra-simulator-client',name:'ASTRA Simulator Client 1.3.0',description:'SDK + pinned ASTRA physics engine: calls run locally in this browser; no Python server',group:'Aerospace',kind:'bundled'},
 {id:'moderngl',name:'ModernGL (native)',description:'OpenGL native contexts unavailable in mobile browsers; use AstraForge 3D WebGL preview instead',group:'Visualization',kind:'external',url:'https://moderngl.readthedocs.io/'},
 {id:'pyfme',name:'PyFME',description:'Flight mechanics engine; legacy project, requires a compatible Python environment',group:'Aerospace',kind:'external',url:'https://github.com/AeroPython/PyFME'},
 {id:'tkinter',name:'Tkinter',description:'Native desktop GUI library; not available inside a browser',group:'Software',kind:'external',url:'https://docs.python.org/3/library/tkinter.html'},
 {id:'django',name:'Django',description:'Server-side web framework; cannot host its HTTP server on GitHub Pages',group:'Software',kind:'external',url:'https://www.djangoproject.com/'},
 {id:'pytorch',name:'PyTorch / CUDA',description:'Native/GPU framework requiring another runtime',group:'AI',kind:'external',url:'https://pytorch.org/'},
 {id:'pyserial',name:'pyserial',description:'Hardware serial port access requires a native or Web Serial integration',group:'Electrical',kind:'external',url:'https://pyserial.readthedocs.io/'},
 {id:'rdkit',name:'RDKit',description:'Specialized cheminformatics builds require separate compatibility validation',group:'Chemistry',kind:'external',url:'https://www.rdkit.org/'}
]);
export const CATALOG=Object.freeze([...MODULES,...SPECIAL_MODULES]);
export const BROWSER_IDS=new Set(MODULES.map(x=>x.id));
export const STDLIB_IDS=new Set(SPECIAL_MODULES.filter(x=>x.kind==='stdlib').map(x=>x.id));
export const BUNDLED_IDS=new Set(SPECIAL_MODULES.filter(x=>x.kind==='bundled').map(x=>x.id));

export const PROFILES=Object.freeze({
 aerospace:{name:'Aerospace engineering',subtitle:'Astrodynamics, guidance, navigation, simulation',groups:['Aerospace','Controls','Thermodynamics','Geospatial','Mathematics','Optimization'],recommended:['numpy','scipy','sympy','matplotlib','astropy','rebound','casadi','astra-simulator-client'],extra:['reboundx','galpy','healpy','cartopy','pyproj','coolprop','xarray','h5py','nlopt','pyfme']},
 mechanical:{name:'Mechanical engineering',subtitle:'Dynamics, structures, CAD and fluid systems',groups:['Mechanical','Thermodynamics','Controls','Optimization','Physics','Mathematics','Data'],recommended:['numpy','scipy','sympy','matplotlib','coolprop','casadi','uncertainties'],extra:['python-solvespace','nlopt','unyt','highspy','xarray','h5py','pandas']},
 computer:{name:'Computer science',subtitle:'Programming, algorithms, software & data',groups:['Software','Data','Database','Mathematics','AI','Optimization'],recommended:['sqlite3','sqlalchemy','numpy','pandas','networkx','pytest','rich','pyyaml'],extra:['scikit-learn','httpx','beautifulsoup4','lxml','orjson','pydantic','mypy','duckdb','django','tkinter']},
 electronics:{name:'Electronics engineering',subtitle:'Circuits, embedded signals and instruments',groups:['Electrical','Signals','Telecom','Controls','Mathematics'],recommended:['numpy','scipy','matplotlib','sympy','pywavelets','inspice'],extra:['casadi','bitstring','bitarray','crcmod','soxr','pandas','pyserial']},
 electrical:{name:'Electrical engineering',subtitle:'Power systems, electrical networks and conversion',groups:['Electrical','Signals','Thermodynamics','Controls','Optimization','Mathematics'],recommended:['numpy','scipy','matplotlib','sympy','casadi','networkx','coolprop'],extra:['inspice','pywavelets','highspy','clarabel','pandas','unyt']},
 chemical:{name:'Chemical engineering',subtitle:'Chemical processes, kinetics and transport',groups:['Thermodynamics','Chemistry','Optimization','Data','Mathematics'],recommended:['numpy','scipy','sympy','matplotlib','coolprop','pandas'],extra:['casadi','h5py','xarray','uncertainties','nlopt','rdkit']},
 energetic:{name:'Energy engineering',subtitle:'Thermodynamics, renewables, storage and optimization',groups:['Thermodynamics','Optimization','Controls','Mathematics','Data'],recommended:['numpy','scipy','matplotlib','coolprop','pandas','highspy'],extra:['casadi','xarray','unyt','networkx','statsmodels','clarabel']},
 management:{name:'Management engineering',subtitle:'Operations research, supply chains and statistics',groups:['Management','Optimization','Statistics','Data','Database','Mathematics'],recommended:['sqlite3','duckdb','numpy','pandas','scipy','statsmodels','networkx','highspy'],extra:['python-sat','vrplib','igraph','duckdb','polars','pyxirr','rateslib','altair']},
 biomedical:{name:'Biomedical engineering',subtitle:'Biomedical signals, imaging and physiology',groups:['Biomedical','Signals','AI','Data','Mathematics'],recommended:['numpy','scipy','matplotlib','pandas','scikit-image','biopython'],extra:['opencv-python','pywavelets','soundfile','soxr','statsmodels','scikit-learn','msprime','tskit']},
 materials:{name:'Materials engineering',subtitle:'Microstructure, characterization and thermodynamics',groups:['Materials','Chemistry','Thermodynamics','Biomedical','Data','Mathematics'],recommended:['numpy','scipy','matplotlib','pandas','scikit-image','coolprop'],extra:['sisl','h5py','xarray','imageio','sympy','unyt','rdkit']},
 automation:{name:'Automation / robotics',subtitle:'Feedback control, state estimation and robotics',groups:['Controls','Optimization','Signals','Software','AI','Mathematics'],recommended:['numpy','scipy','sympy','matplotlib','casadi','filterpy'],extra:['opencv-python','pywavelets','networkx','nlopt','scikit-learn','clarabel','pyserial']},
 ai:{name:'Artificial intelligence',subtitle:'Machine learning, vision and NLP',groups:['AI','Computer vision','Statistics','Data','Mathematics'],recommended:['numpy','pandas','scipy','scikit-learn','matplotlib','xgboost'],extra:['lightgbm','opencv-python','nltk','sentencepiece','tiktoken','safetensors','pytorch','statsmodels']},
 telecom:{name:'Telecommunications',subtitle:'DSP, communication protocols and networks',groups:['Telecom','Signals','Electrical','Optimization','Mathematics'],recommended:['numpy','scipy','matplotlib','pywavelets','bitstring','networkx'],extra:['bitarray','crcmod','crc32c','protobuf','msgpack','soxr','statsmodels']},
 mathematics:{name:'Mathematics / statistics',subtitle:'Symbolic, numerical & probabilistic mathematics',groups:['Mathematics','Optimization','Statistics','Data','Visualization'],recommended:['numpy','scipy','sympy','matplotlib','mpmath','statsmodels'],extra:['networkx','uncertainties','highspy','patsy','nlopt','clarabel','polars']},
 physics:{name:'Physics',subtitle:'Classical, statistical and computational physics',groups:['Physics','Aerospace','Thermodynamics','Mathematics','Optimization'],recommended:['numpy','scipy','sympy','matplotlib','unyt','uncertainties'],extra:['astropy','rebound','coolprop','mpmath','casadi','h5py','xarray']},
 general:{name:'General Python',subtitle:'Standard library, testing and data tools',groups:['Software','Data','Database','Mathematics','Visualization'],recommended:['sqlite3','numpy','pandas','sympy','matplotlib','pytest'],extra:['pyyaml','pydantic','rich','httpx','mypy','django','tkinter']}
});
// Not a Pyodide-built package: filterpy is pure Python but its wheel is not verified here.
for(const profile of Object.values(PROFILES)){
 profile.recommended=profile.recommended.filter(id=>CATALOG.some(pkg=>pkg.id===id));
 profile.extra=profile.extra.filter(id=>CATALOG.some(pkg=>pkg.id===id));
}
export function forProfile(key){const p=PROFILES[key]||PROFILES.general;const ids=new Set([...p.recommended,...p.extra]);return CATALOG.filter(x=>ids.has(x.id)||p.groups.includes(x.group));}
