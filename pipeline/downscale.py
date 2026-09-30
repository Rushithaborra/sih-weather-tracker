"""PLACEHOLDER for the designed (not implemented) diffusion downscaler.

This is plain bilinear interpolation from 0.25 deg to 0.05 deg inside a box.
It adds no new information: it only draws a smoother picture of the same
coarse field.
"""
import numpy as np
from scipy.interpolate import RegularGridInterpolator


def bilinear_box(field2d, lat, lon, box, res=0.05):
    """field2d on ascending (lat, lon); box = (lat_min, lat_max, lon_min, lon_max)."""
    lat_min, lat_max, lon_min, lon_max = box
    lat_min, lat_max = max(lat_min, lat[0]), min(lat_max, lat[-1])
    lon_min, lon_max = max(lon_min, lon[0]), min(lon_max, lon[-1])
    fine_lat = np.arange(lat_min, lat_max + res / 2, res)
    fine_lon = np.arange(lon_min, lon_max + res / 2, res)
    f = RegularGridInterpolator((lat, lon), field2d, method="linear")
    LAT, LON = np.meshgrid(fine_lat, fine_lon, indexing="ij")
    return fine_lat, fine_lon, f(np.stack([LAT, LON], axis=-1))
