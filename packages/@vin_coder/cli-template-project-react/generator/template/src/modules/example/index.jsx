import React from "react";
import { Switch, Route } from "react-router-dom";

import Home from "./home";

const Routes = ({ location }) => (
  <Switch location={location}>
    <Route exact path="/account" component={Home} />
  </Switch>
);

export default Routes;
