# import sys
# sys.path.append("../../") # Go to base utils path
from datetime import datetime
import pandas as pd
import numpy as np

from .anchor_points.bocpd.poisson_gamma.extract_change_points import return_cps_from_bocpd_poisson_gamma_user_feature_data

def return_anchor_points_for_method(method:str, 
                                    distribution:str='pg',
                                    user_data:pd.DataFrame | None = None, 
                                    alpha:float=0.01, 
                                    beta:float=0.1, 
                                    hazard:float=1000, 
                                    user_id:str | None =None,
                                    process_into:str='dates', 
                                    feature:str='posts'):
    """
    Inputs:
    =======
    method = String. The specified model to use, to create anchor points (e.g. change-points)
    user_feature_data = Pandas dataframe for the user, consisting of all their features.
    
    Outputs:
    ========
    An ordered, de-duplicated list of datetimes indicating the anchor points. Can specify to process it as date (days), 
    or keep as accurate timestamps.
    """
    # Extract just the relevant feature, as a Series
    user_feature_data = user_data[feature]
    
    anchor_points = None
        
    # BOCPD
    if method == 'bocpd':
        
        # Specified distribution and priors, which we assume the data-generating process can be modelled by
        # distribution = method_params[0]
        if distribution == 'pg':  # Poisson-Gamma model
            print("Using Poisson-Gamma BOCPD model")
            prior_hazard = hazard
            prior_alpha = alpha
            prior_beta = beta
        
            # Extract change-points using the Poisson-Gamma model
            anchor_points = return_cps_from_bocpd_poisson_gamma_user_feature_data(user_feature_data,
                                                                  prior_hazard=prior_hazard,
                                                                  prior_alpha=prior_alpha,
                                                                  prior_beta=prior_beta,
                                                                  post_process=process_into)
    # Post-processing
    anchor_points = postprocess_anchor_points(user_feature_data, anchor_points, style=process_into)
            
        
    return anchor_points


def postprocess_anchor_points(user_feature_data, anchor_points=None, style='default'):
    # Check if any anchor points exist, and return empty list of anchor points
    if anchor_points == None:
        anchor_points = []
    if len(anchor_points) == 0:
        return anchor_points
    
    # Continue postprocessing, if points exist
    else:
        # Remove duplicate anchor points
        anchor_points = list(set(anchor_points))
        
        # Sort in ascending order
        anchor_points.sort()

        if style == 'default':
            return anchor_points
        
        # Check type of data
        data_type = type(anchor_points[0])
        
        if style == 'dates':
            if data_type == int or data_type == float:
                return convert_days_since_to_datetimes(user_feature_data, anchor_points)
            elif data_type == pd.Timestamp:
                anchor_points = convert_timestamp_to_datetime(anchor_points)
                return anchor_points
            else:
                return anchor_points
            
            
            
def convert_np_dt_to_dt(dt64):
    ts = (dt64 - np.datetime64('1970-01-01T00:00:00Z')) / np.timedelta64(1, 's')
    
    
    return datetime.utcfromtimestamp(ts).date()

def convert_days_since_to_datetimes(user_feature_data, anchor_points):
    # Convert days to datetimes.
    dt_points = pd.Series(user_feature_data.index)[anchor_points].values
    dt_points = list(dt_points)

    # Convert NumPy DateTime object to a datetime Date object.
    converted_dts = []
    for np_dt in dt_points:
        converted = convert_np_dt_to_dt(np_dt)
        converted_dts.append(converted)

    # Update with dates
    return converted_dts

def convert_timestamp_to_datetime(anchor_points):
    processed = []
    for p in anchor_points:
        processed.append(p.to_pydatetime().date())
    
    return processed
    