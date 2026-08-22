package cx.ivc;

public interface IvcServlet {
    
    /**
     * Stable name used to identify this servlet.
     */
    String name();

    /**
     * Does this servlet handle the ivc:// object?
     *
     * @param uri URI structure to match against.
     * @return true if it handles this URI, false otherwise
     */
    boolean handles(IvcUri uri);

    /**
     * Dispatched when an IVC delta is matched to this servlet via handled URIs.
     * 
     * @param d The delta object being processed.
     */
    default void onDelta(Delta d) {
        throw new UnsupportedOperationException(
            "Servlet '" + name() + "' does not support deltas"
        );
    }
    
    default IvcResponse service(IvcRequest request) {
        throw new UnsupportedOperationException(
            "Servlet '" + name() + "' does not support service requests"
        );
    }
}
