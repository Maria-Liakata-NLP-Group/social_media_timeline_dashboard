import pickle 
import pandas as pd
import json
from .generate_anchor_points import return_anchor_points_for_method
from .create_timelines import return_anchor_points_for_user, merge_overlapping_spans

def create_timeline_for_dashboard(unpickled_posts: dict, 
                                  method:str='bocpd', 
                                  alpha:float=0.01, 
                                  beta:float=0.1, 
                                  hazard:float=1000, 
                                  span_radius:int=7) -> dict:
    
    '''
    INPUTS:
    unpickled_posts: dict
        Dictionary of posts for a user from the Reddit dataset which is saved as a pickle file on the server.
        Expects the file to have been unpickled before passing to this function.
    method: str
        Method to use for generating anchor points. Currently only 'bocpd' is implemented.
    alpha: float
        Alpha parameter for the Poisson-Gamma BOCPD model.
    beta: float
        Beta parameter for the Poisson-Gamma BOCPD model.
    hazard: float
        Hazard parameter for the Poisson-Gamma BOCPD model.
    span_radius: int
        Number of days to extend before and after each anchor point to create timelines.
    ==========================================================================
    OUTPUTS:
    timeline_dict: dict
        Dictionary of timelines in the format to be used by the frontend.
        Each key is a timeline in the format "start_id-end_id" and the value is a dictionary with:
            "timeline_of_interest": bool (set to True by default)
            "posts": list of post ids in the timeline
    '''

    # Convert to pandas DataFrame
    posts = pd.DataFrame(unpickled_posts)

    # Calculate number of posts per day and put data frame into shape
    # where index is datetime and column is number of posts
    posts['created_utc'] = pd.to_datetime(posts['created_utc'], unit='s')
    posts.set_index('created_utc', inplace=True)
    posts = posts.resample('D').agg({'id':list})
    posts['posts'] = posts['id'].apply(len)

    anchor_points = return_anchor_points_for_method(method, user_data=posts, alpha=alpha, beta=beta, hazard=hazard, feature='posts')

    timelines = return_anchor_points_for_user(anchor_points, span_radius=span_radius)

    timelines = merge_overlapping_spans(timelines)

    # Matching timelines to posts
    # Dict to hold timeline posts in the format to be used by frontend
    timeline_dict = {}
    for timeline in timelines:
        start, end = timeline
        # extract post ids in the date range (start, end), flatten the list of ids to one list and remove NaNs
        matched_posts = posts.loc[start:end]["id"].explode().dropna().tolist()
        if len(matched_posts) == 0:
            print("Empty timeline for range", start, end)
            continue  # Skip empty timelines
        # create key in the format "start_id-end_id"
        timeline_key = f"{matched_posts[0]}-{matched_posts[-1]}"
        timeline_dict[timeline_key] = {
            "timeline_of_interest": True,
            "posts": matched_posts
        }

    return timeline_dict