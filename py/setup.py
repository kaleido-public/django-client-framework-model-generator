import setuptools

setuptools.setup(
    name="dcf_gen_kotlin_models",  # Replace with your own username
    version="0.0.3",
    author="Yu Li",
    author_email="ylilarry@gmail.com",
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
    entry_points={
        "console_scripts": [
            "gen-kotlin-models=dcf_gen_kotlin_models.gen_kotlin_models:main",
        ]
    },
)
